import { OFFICIAL_PERFECTPAY_66_DATASET } from '@/config/official-perfectpay-dataset';
import { describe, it } from 'vitest';

describe('Generate 66 Table', () => {
  it('prints the 66 comparison table', () => {
    // We know from the database query that the database only has 1 physical row:
    // id: '2e9b6558-eb6d-4767-b6fc-77c245778653', platform: 'instagram', service: 'followers', product: 'PPPBF6TP', plan: 'PPLQQQ3F7'
    const physicalOffers = [
      {
        id: '2e9b6558-eb6d-4767-b6fc-77c245778653',
        platform: 'instagram',
        service: 'followers',
        perfectpay_product_id: 'PPPBF6TP',
        perfectpay_plan_id: 'PPLQQQ3F7'
      }
    ];

    const results = OFFICIAL_PERFECTPAY_66_DATASET.map(item => {
      const match = physicalOffers.find(o => 
        o.platform === item.platform &&
        o.service === item.service &&
        o.perfectpay_product_id === item.productCode &&
        o.perfectpay_plan_id === item.planCode
      );

      return {
        platform: item.platform,
        service: item.service,
        plan: item.plan,
        canonicalId: `canonical-${item.platform}-${item.service}-${item.plan}`,
        physicalOfferId: match ? match.id : 'NONE',
        productCode: item.productCode,
        planCode: item.planCode,
        status: match ? 'MATCH' : 'NO MATCH'
      };
    });

    process.stdout.write(JSON.stringify(results, null, 2) + '\n');
  });
});
