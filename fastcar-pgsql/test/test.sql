-- ===========================================
-- fastcar-pgsql 测试数据库初始化脚本
-- ===========================================

-- 启用必要的扩展
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 安装 pgvector 扩展（如果需要向量功能）
-- 注意：需要先在 PostgreSQL 中安装 pgvector 扩展
-- CREATE EXTENSION IF NOT EXISTS "vector";

-- ===========================================
-- 测试表: test_crud
-- 用于 CRUD 操作测试
-- ===========================================
DROP TABLE IF EXISTS test_crud CASCADE;

CREATE TABLE test_crud (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255),
    value INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE test_crud IS 'CRUD 测试表';
COMMENT ON COLUMN test_crud.id IS '主键ID';
COMMENT ON COLUMN test_crud.name IS '名称';
COMMENT ON COLUMN test_crud.value IS '数值';
COMMENT ON COLUMN test_crud.created_at IS '创建时间';

-- ===========================================
-- 测试表: test_vector
-- 用于向量功能测试（需要 pgvector 扩展）
-- ===========================================
DROP TABLE IF EXISTS test_vector CASCADE;

-- 如果 pgvector 扩展已安装，则创建向量表
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'vector') THEN
        EXECUTE 'CREATE TABLE test_vector (
            id BIGSERIAL PRIMARY KEY,
            name VARCHAR(255),
            embedding vector(3)
        )';
        
        EXECUTE 'COMMENT ON TABLE test_vector IS ''向量功能测试表''';
        EXECUTE 'COMMENT ON COLUMN test_vector.id IS ''主键ID''';
        EXECUTE 'COMMENT ON COLUMN test_vector.name IS ''名称''';
        EXECUTE 'COMMENT ON COLUMN test_vector.embedding IS ''向量数据(3维)''';
    ELSE
        -- 如果没有 pgvector，创建一个简化版表
        CREATE TABLE test_vector (
            id BIGSERIAL PRIMARY KEY,
            name VARCHAR(255),
            embedding TEXT  -- 降级为 TEXT 存储
        );
        
        COMMENT ON TABLE test_vector IS '向量功能测试表(简化版，未安装 pgvector)';
        COMMENT ON COLUMN test_vector.id IS '主键ID';
        COMMENT ON COLUMN test_vector.name IS '名称';
        COMMENT ON COLUMN test_vector.embedding IS '向量数据(TEXT格式)';
        
        RAISE NOTICE 'pgvector 扩展未安装，test_vector 表使用 TEXT 类型存储向量';
    END IF;
END $$;

-- ===========================================
-- 测试表: test (已有测试使用的表)
-- 用于 example 测试
-- ===========================================
DROP TABLE IF EXISTS test CASCADE;

CREATE TABLE test (
    id BIGSERIAL PRIMARY KEY,
    list JSONB,
    create_time TIMESTAMP WITHOUT TIME ZONE,
    update_time TIMESTAMP WITH TIME ZONE,
    name CHARACTER VARYING(255),
    case_name CHARACTER VARYING(255),
    num_int INTEGER,
    money MONEY,
    num_float DOUBLE PRECISION,
    flag BOOLEAN DEFAULT FALSE,
    l_uuid UUID,
    local_ip INET
);

COMMENT ON TABLE test IS '通用测试表';

-- ===========================================
-- ReverseGenerate schema 测试表
-- ===========================================
CREATE SCHEMA IF NOT EXISTS custom;
DROP TABLE IF EXISTS custom.test_reverse_gen CASCADE;

CREATE TABLE custom.test_reverse_gen (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(64) NOT NULL,
    payload JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE custom.test_reverse_gen IS 'ReverseGenerate schema 测试表';
COMMENT ON COLUMN custom.test_reverse_gen.id IS '主键ID';
COMMENT ON COLUMN custom.test_reverse_gen.name IS '名称';
COMMENT ON COLUMN custom.test_reverse_gen.payload IS '负载数据';
COMMENT ON COLUMN custom.test_reverse_gen.created_at IS '创建时间';

-- ===========================================
-- 索引
-- ===========================================

-- test_crud 表的索引
CREATE INDEX IF NOT EXISTS idx_test_crud_name ON test_crud(name);
CREATE INDEX IF NOT EXISTS idx_test_crud_value ON test_crud(value);

-- test_vector 表的向量索引（可选，需要 pgvector）
-- 注意：向量索引在数据插入后创建效果更佳

-- test 表的索引
CREATE INDEX IF NOT EXISTS idx_test_name ON test(name);
CREATE INDEX IF NOT EXISTS idx_test_case_name ON test(case_name);

-- ===========================================
-- 测试数据
-- ===========================================

-- test_crud 基础测试数据
INSERT INTO test_crud (name, value, created_at) VALUES 
    ('apple', 10, NOW()),
    ('banana', 20, NOW()),
    ('cherry', 30, NOW()),
    ('date', 40, NOW()),
    ('elderberry', 50, NOW());

-- test_vector 向量测试数据（如果 pgvector 已安装）
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'vector') THEN
        EXECUTE 'INSERT INTO test_vector (name, embedding) VALUES 
            (''point-a'', ''[1, 0, 0]''::vector),
            (''point-b'', ''[0, 1, 0]''::vector),
            (''point-c'', ''[0, 0, 1]''::vector),
            (''point-d'', ''[1, 1, 0]''::vector),
            (''point-e'', ''[0.5, 0.5, 0.5]''::vector)';
    ELSE
        INSERT INTO test_vector (name, embedding) VALUES 
            ('point-a', '[1, 0, 0]'),
            ('point-b', '[0, 1, 0]'),
            ('point-c', '[0, 0, 1]'),
            ('point-d', '[1, 1, 0]'),
            ('point-e', '[0.5, 0.5, 0.5]');
    END IF;
END $$;

-- ===========================================
-- 使用说明
-- ===========================================

/*
执行方式：
1. 使用 psql 命令行:
   psql -U postgres -d your_database -f test/test.sql

2. 使用 pgAdmin:
   打开 Query Tool，复制粘贴此脚本执行

3. 使用 Node.js:
   通过 PgsqlDataSourceManager 执行 SQL 文件

注意：
- 执行前请确保已连接到正确的数据库
- 建议先在测试数据库上执行
- 生产环境请谨慎使用 DROP TABLE 语句
*/
