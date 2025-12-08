create table if not exists hello(
  id serial primary key,
  msg text
);
insert into hello(msg) values ('world') on conflict do nothing;
