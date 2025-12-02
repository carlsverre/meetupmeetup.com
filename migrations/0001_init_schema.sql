-- Migration number: 0001 	 2025-12-02T18:59:37.594Z

create table subscribers (
		id integer primary key,
		email text not null unique,
		created_at text not null default current_timestamp
);
