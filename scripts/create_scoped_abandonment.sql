DO $$
DECLARE
  v_event_id text := gen_random_uuid()::text;
  v_now timestamptz := NOW();
  v_payload jsonb;
  v_context_data jsonb;
BEGIN
  -- Build payload exactly matching schema and scheduler
  v_payload := json_build_object(
    'platform', 'instagram',
    'service', 'followers',
    'canonicalOfferId', 'canonical-instagram-followers-starter',
    'offerId', '2e9b6558-eb6d-4767-b6fc-77c245778653',
    'contextId', 'CFCTX_94510b0aaa3205cbfbd9ac55',
    'checkoutContextId', 'CFCTX_94510b0aaa3205cbfbd9ac55',
    'targetHandle', 'neymarjr',
    'target', 'neymarjr',
    'priceCents', 1490,
    'leadId', '21d968cf-ad8a-4177-b5d2-2569a16d45f3',
    'sourceEventId', '034e3acc-00ae-45c0-8c25-836c15a50c64',
    'journeyId', 'CFCTX_94510b0aaa3205cbfbd9ac55',
    'evaluatedAt', v_now::text
  )::jsonb;

  -- 1. Insert CHECKOUT_ABANDONED event
  INSERT INTO lifecycle_events (
    id, customer_email, event_type, idempotency_key, payload, created_at
  ) VALUES (
    v_event_id,
    'instaplussoftware@gmail.com',
    'CHECKOUT_ABANDONED',
    'CHECKOUT_ABANDONED:JOURNEY:CFCTX_94510b0aaa3205cbfbd9ac55',
    v_payload,
    v_now
  );

  -- Step 1 contextData
  v_context_data := json_build_object(
    'platform', 'instagram',
    'service', 'followers',
    'canonicalOfferId', 'canonical-instagram-followers-starter',
    'offerId', '2e9b6558-eb6d-4767-b6fc-77c245778653',
    'contextId', 'CFCTX_94510b0aaa3205cbfbd9ac55',
    'checkoutContextId', 'CFCTX_94510b0aaa3205cbfbd9ac55',
    'targetHandle', 'neymarjr',
    'target', 'neymarjr',
    'priceCents', 1490,
    'journeyId', 'CFCTX_94510b0aaa3205cbfbd9ac55',
    'stepNumber', 1
  )::jsonb;

  -- Step 1 Automation (now)
  INSERT INTO lifecycle_automations (
    id, lifecycle_event_id, customer_email, automation_id, action_type, scheduled_for, status, context_data, attempts, created_at, updated_at
  ) VALUES (
    gen_random_uuid()::text,
    v_event_id,
    'instaplussoftware@gmail.com',
    'ABANDONED_CART_STEP_1',
    'ABANDONED_CART',
    v_now,
    'PENDING',
    v_context_data,
    0,
    v_now,
    v_now
  );

  -- Step 2 contextData (+24h)
  v_context_data := json_build_object(
    'platform', 'instagram',
    'service', 'followers',
    'canonicalOfferId', 'canonical-instagram-followers-starter',
    'offerId', '2e9b6558-eb6d-4767-b6fc-77c245778653',
    'contextId', 'CFCTX_94510b0aaa3205cbfbd9ac55',
    'checkoutContextId', 'CFCTX_94510b0aaa3205cbfbd9ac55',
    'targetHandle', 'neymarjr',
    'target', 'neymarjr',
    'priceCents', 1490,
    'journeyId', 'CFCTX_94510b0aaa3205cbfbd9ac55',
    'stepNumber', 2
  )::jsonb;

  -- Step 2 Automation (+24h)
  INSERT INTO lifecycle_automations (
    id, lifecycle_event_id, customer_email, automation_id, action_type, scheduled_for, status, context_data, attempts, created_at, updated_at
  ) VALUES (
    gen_random_uuid()::text,
    v_event_id,
    'instaplussoftware@gmail.com',
    'ABANDONED_CART_STEP_2',
    'ABANDONED_CART',
    v_now + INTERVAL '24 hours',
    'PENDING',
    v_context_data,
    0,
    v_now,
    v_now
  );

  -- Step 3 contextData (+48h)
  v_context_data := json_build_object(
    'platform', 'instagram',
    'service', 'followers',
    'canonicalOfferId', 'canonical-instagram-followers-starter',
    'offerId', '2e9b6558-eb6d-4767-b6fc-77c245778653',
    'contextId', 'CFCTX_94510b0aaa3205cbfbd9ac55',
    'checkoutContextId', 'CFCTX_94510b0aaa3205cbfbd9ac55',
    'targetHandle', 'neymarjr',
    'target', 'neymarjr',
    'priceCents', 1490,
    'journeyId', 'CFCTX_94510b0aaa3205cbfbd9ac55',
    'stepNumber', 3
  )::jsonb;

  -- Step 3 Automation (+48h)
  INSERT INTO lifecycle_automations (
    id, lifecycle_event_id, customer_email, automation_id, action_type, scheduled_for, status, context_data, attempts, created_at, updated_at
  ) VALUES (
    gen_random_uuid()::text,
    v_event_id,
    'instaplussoftware@gmail.com',
    'ABANDONED_CART_STEP_3',
    'ABANDONED_CART',
    v_now + INTERVAL '48 hours',
    'PENDING',
    v_context_data,
    0,
    v_now,
    v_now
  );
END $$;
