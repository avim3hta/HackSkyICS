// Mock Supabase client for backend security functionality
// This provides the interface expected by security components

class MockSupabaseClient {
    constructor() {
        this.data = new Map(); // Simple in-memory storage
    }

    from(table) {
        return new MockTable(table, this.data);
    }
}

class MockTable {
    constructor(tableName, data) {
        this.tableName = tableName;
        this.data = data;
        this.query = {};
    }

    async insert(record) {
        const key = `${this.tableName}_${Date.now()}_${Math.random()}`;
        if (!this.data.has(this.tableName)) {
            this.data.set(this.tableName, new Map());
        }
        this.data.get(this.tableName).set(key, { ...record, id: key });
        
        return {
            data: { ...record, id: key },
            error: null
        };
    }

    async select(columns = '*') {
        this.query.select = columns;
        return this;
    }

    async eq(column, value) {
        this.query.eq = { column, value };
        return this;
    }

    async single() {
        const tableData = this.data.get(this.tableName);
        if (!tableData) {
            return { data: null, error: 'Table not found' };
        }

        if (this.query.eq) {
            for (const [key, record] of tableData.entries()) {
                if (record[this.query.eq.column] === this.query.eq.value) {
                    return { data: record, error: null };
                }
            }
            return { data: null, error: 'Record not found' };
        }

        // Return first record if no filter
        const firstKey = Array.from(tableData.keys())[0];
        return firstKey ? { data: tableData.get(firstKey), error: null } : { data: null, error: 'No records' };
    }

    async update(updates) {
        const tableData = this.data.get(this.tableName);
        if (!tableData) {
            return { data: null, error: 'Table not found' };
        }

        if (this.query.eq) {
            for (const [key, record] of tableData.entries()) {
                if (record[this.query.eq.column] === this.query.eq.value) {
                    const updatedRecord = { ...record, ...updates };
                    tableData.set(key, updatedRecord);
                    return { data: updatedRecord, error: null };
                }
            }
        }

        return { data: null, error: 'Record not found' };
    }
}

// Create and export mock supabase client
const supabase = new MockSupabaseClient();

// Initialize with some mock data for testing
supabase.data.set('users', new Map([
    ['user1', {
        id: 'user1',
        email: 'admin@hackskyics.com',
        password_hash: '$2a$10$example.hash.for.demo.purposes.only',
        role: 'system_admin',
        permissions: ['*'],
        facility: 'all',
        mfa_enabled: false
    }]
]));

console.log('✅ Mock Supabase client initialized for security testing');

module.exports = { supabase };