import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { db } from '@/db';
import { orders, fulfillmentOrders } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { resolveCanonicalFulfillmentTarget } from '@/services/fulfillment.service';
import { evaluateOrderForAutoDispatch, evaluateWaitingProviderReconciliation, evaluateWaitingProviderRecovery } from '@/services/fulfillment-auto-dispatch.service';
import { inspectTargetDeliverySlot } from '@/services/fulfillment-target-queue.service';

export async function GET(request: Request) {
  try {
    await requireAdmin();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    if (!status) {
      return NextResponse.json({ success: false, error: { message: 'status parameter is required' } }, { status: 400 });
    }

    // 1. Fetch Orders with requested status
    const matchingOrders = await db.query.orders.findMany({
      where: eq(orders.fulfillmentStatus, status),
      orderBy: desc(orders.createdAt),
      limit: 100, // Limit to recent 100 to prevent overload during inspection
    });

    const result = [];

    // 2. Fetch associated records & generate diagnosis per order
    for (const order of matchingOrders) {
      const fOrders = await db.query.fulfillmentOrders.findMany({
        where: eq(fulfillmentOrders.orderId, order.id),
        orderBy: desc(fulfillmentOrders.createdAt),
      });

      // Events can be used if needed in the future, omitting unused query for performance
      const latestFulfillment = fOrders[0];

      // Build Diagnosis Object
      const diagnosis: {
        summary: string;
        details: Record<string, unknown>;
        actions: string[];
      } = {
        summary: '',
        details: {},
        actions: []
      };

      if (status === 'FAILED') {
        const hasProviderOrder = !!latestFulfillment?.externalOrderId;
        const hasCost = (latestFulfillment?.providerCostCents || 0) > 0;
        
        diagnosis.details = {
          lastError: latestFulfillment?.lastError || 'Unknown error',
          provider: latestFulfillment?.provider || 'Unknown',
          tier: latestFulfillment?.providerTier || 'Unknown',
          hasProviderOrder,
          hasCost,
          isRetrySafe: !hasProviderOrder && !hasCost // Simplified safety check: safe if we haven't sent to provider or incurred cost
        };
        
        if (hasProviderOrder) {
           diagnosis.summary = "Provider order exists but latest provider synchronization returned an error.";
        } else {
           diagnosis.summary = "Dispatch failed before a provider order was created.";
        }
        
        // Add safe actions
        diagnosis.actions.push('View Order');
        if (diagnosis.details.isRetrySafe) {
          diagnosis.actions.push('Reconcile');
        }

      } else if (status === 'NOT_DISPATCHED') {
        // Run dry evaluation to find EXACT reason
        const evaluation = await evaluateOrderForAutoDispatch(order.id);
        
        diagnosis.details = {
          eligibilityCode: evaluation.code,
          exactReason: evaluation.reason,
          missingRequirement: evaluation.code?.startsWith('BLOCKED_MISSING_') ? evaluation.code.replace('BLOCKED_MISSING_', '') : 'OTHER'
        };
        
        if (evaluation.code === 'BLOCKED_MISSING_CHAIN') {
            diagnosis.summary = "Order cannot dispatch because no active fulfillment chain matches this service.";
        } else if (evaluation.code === 'BLOCKED_MISSING_TARGET') {
            diagnosis.summary = "Order is missing a valid target URL for delivery.";
        } else {
            diagnosis.summary = `Order cannot dispatch: ${evaluation.reason || 'Unknown reason.'}`;
        }
        
        diagnosis.actions.push('View Order');

      } else if (status === 'WAITING_TARGET_SLOT') {
        const targetValidation = resolveCanonicalFulfillmentTarget(order);
        if (targetValidation.success && targetValidation.target) {
            const slotInspection = await inspectTargetDeliverySlot({ 
                platform: order.platform || '', 
                canonicalTarget: targetValidation.target 
            });
            
            diagnosis.details = {
                canonicalTarget: targetValidation.target,
                slotStatus: slotInspection.isSlotBusy ? 'BUSY' : 'FREE',
                activeOrderOccupying: slotInspection.activeOrder?.id || null,
                autoRelease: 'enabled' // Implicit in current system via cron/events
            };
            
            if (slotInspection.isSlotBusy) {
                diagnosis.summary = `Waiting because another active delivery is using this ${order.platform} target.`;
            } else {
                diagnosis.summary = "Target slot is free. Order should be dispatched in the next cycle.";
            }
        } else {
             diagnosis.summary = "Waiting for target slot but target validation failed.";
             diagnosis.details = { error: !targetValidation.success ? targetValidation.message : 'Invalid target' };
        }
        
        diagnosis.actions.push('View Order');
        diagnosis.actions.push('Open Target Queue');

      } else if (status === 'WAITING_PROVIDER') {
         const reconEval = await evaluateWaitingProviderReconciliation(order.id);
         const recovEval = await evaluateWaitingProviderRecovery(order.id);
         
         diagnosis.details = {
             expectedProvider: 'peakerr',
             reason: reconEval.reason || recovEval.reason || 'Waiting for provider connection/capacity.',
             reconcileAvailable: reconEval.eligibleForReconciliation,
             retryAvailable: recovEval.eligibleForRecovery
         };
         
         diagnosis.summary = `Waiting for provider: ${diagnosis.details.reason}`;
         
         diagnosis.actions.push('View Order');
         if (reconEval.eligibleForReconciliation) diagnosis.actions.push('Reconcile');
         if (recovEval.eligibleForRecovery) diagnosis.actions.push('Retry');
         
      } else if (status === 'PROCESSING' || status === 'PARTIAL') {
         const respPayload = latestFulfillment?.responsePayload as Record<string, unknown> | null;
         diagnosis.details = {
             providerOrderId: latestFulfillment?.externalOrderId || 'None',
             startCount: respPayload?.start_count ?? 'Unknown',
             remains: respPayload?.remains ?? 'Unknown',
             lastSync: latestFulfillment?.updatedAt,
             currentProviderStatus: latestFulfillment?.status
         };
         
         diagnosis.summary = `Order is currently ${status} at provider.`;
         diagnosis.actions.push('View Order');
         diagnosis.actions.push('Sync Status');
      }

      result.push({
        order: {
          id: order.id,
          publicId: order.publicId,
          platform: order.platform,
          service: order.service,
          targetUrl: order.targetUrl,
          quantity: order.quantity,
          paymentStatus: order.paymentStatus,
          fulfillmentStatus: order.fulfillmentStatus,
          createdAt: order.createdAt,
          updatedAt: order.updatedAt,
        },
        providerInfo: {
            provider: latestFulfillment?.provider || null,
            tier: latestFulfillment?.providerTier || null,
            serviceId: latestFulfillment?.externalServiceId || null,
            orderId: latestFulfillment?.externalOrderId || null,
            costCents: latestFulfillment?.providerCostCents || null,
            costSource: latestFulfillment?.providerCostSource || null
        },
        diagnosis
      });
    }

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error: unknown) {
    const err = error as Error;
    if (err.message === 'Unauthorized' || err.message === 'Forbidden') {
      return NextResponse.json(
        { success: false, error: { message: 'Unauthorized access.' } },
        { status: 401 }
      );
    }
    console.error('[AdminInspectAPI] Error:', err);
    return NextResponse.json(
      { success: false, error: { message: 'Internal server error' } },
      { status: 500 }
    );
  }
}
