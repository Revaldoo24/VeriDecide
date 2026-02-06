insert into tenants (id, name, status)
select '11111111-1111-1111-1111-111111111111', 'Demo Regulatory Tenant', 'ACTIVE'
where not exists (select 1 from tenants where id = '11111111-1111-1111-1111-111111111111');

insert into policies (tenant_id, name, rules, active)
select
  '11111111-1111-1111-1111-111111111111',
  'Default Regulatory Policy',
  '{"minEvidenceRatio":0.6,"minConfidence":0.55,"maxRisk":"MEDIUM","forbidTopics":["medical diagnosis","weapon","surveillance"]}'::jsonb,
  true
where not exists (
  select 1 from policies
  where tenant_id = '11111111-1111-1111-1111-111111111111'
);
