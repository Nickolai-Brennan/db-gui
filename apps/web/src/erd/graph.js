export function tableKey(schema, table) {
    return `${schema}.${table}`;
}
export function edgeKeyFromFk(fk) {
    const c = `${fk.childSchema}.${fk.childTable}(${fk.childCols.join(',')})`;
    const p = `${fk.parentSchema}.${fk.parentTable}(${fk.parentCols.join(',')})`;
    return `${c}->${p}`;
}
export function buildGraph(snapshot, annotations) {
    const colsByTable = new Map();
    for (const c of snapshot.columns) {
        const k = tableKey(c.schema, c.table);
        const list = colsByTable.get(k) ?? [];
        list.push({ name: c.name, dataType: c.dataType, isNullable: c.isNullable });
        colsByTable.set(k, list);
    }
    const pkByTable = new Map();
    for (const pk of snapshot.primaryKeys)
        pkByTable.set(tableKey(pk.schema, pk.table), pk.columns);
    const idxByTable = new Map();
    for (const idx of snapshot.indexes) {
        const k = tableKey(idx.schema, idx.table);
        const list = idxByTable.get(k) ?? [];
        list.push({ name: idx.name, columns: idx.columns ?? [], isUnique: idx.isUnique, isPrimary: idx.isPrimary, isValid: idx.isValid });
        idxByTable.set(k, list);
    }
    const badgeByTable = new Map();
    if (annotations?.tables) {
        for (const t of annotations.tables) {
            badgeByTable.set(tableKey(t.schema, t.table), { severity: t.severity, count: t.count });
        }
    }
    const nodes = snapshot.tables.map((t) => {
        const key = tableKey(t.schema, t.name);
        const cols = (colsByTable.get(key) ?? []).sort((a, b) => a.name.localeCompare(b.name));
        const idx = (idxByTable.get(key) ?? []).sort((a, b) => a.name.localeCompare(b.name));
        return {
            key,
            schema: t.schema,
            table: t.name,
            columns: cols,
            pkCols: pkByTable.get(key) ?? [],
            indexes: idx,
            badge: badgeByTable.get(key),
        };
    });
    const edgeAnn = new Map();
    if (annotations?.relationships) {
        for (const r of annotations.relationships) {
            if (!r.parentSchema || !r.parentTable)
                continue;
            const k = edgeKeyFromFk({
                childSchema: r.childSchema,
                childTable: r.childTable,
                childCols: r.childCols,
                parentSchema: r.parentSchema,
                parentTable: r.parentTable,
                parentCols: r.parentCols ?? [],
            });
            edgeAnn.set(k, { severity: r.severity, count: r.count });
        }
    }
    const edges = snapshot.foreignKeys.map((fk) => {
        const key = edgeKeyFromFk({
            childSchema: fk.childSchema,
            childTable: fk.childTable,
            childCols: fk.childCols,
            parentSchema: fk.parentSchema,
            parentTable: fk.parentTable,
            parentCols: fk.parentCols,
            name: fk.name,
        });
        const ann = edgeAnn.get(key);
        return {
            key,
            name: fk.name,
            childKey: tableKey(fk.childSchema, fk.childTable),
            parentKey: tableKey(fk.parentSchema, fk.parentTable),
            childCols: fk.childCols,
            parentCols: fk.parentCols,
            severity: ann?.severity,
            count: ann?.count,
        };
    });
    const schemaByKey = {};
    for (const n of nodes)
        schemaByKey[n.key] = n.schema;
    return { nodes, edges, schemaByKey };
}
