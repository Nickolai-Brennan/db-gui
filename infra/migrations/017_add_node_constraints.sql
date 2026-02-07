-- Migration 017: Add node constraints and indexes for better data integrity

-- Ensure item-only fields are null for groups
ALTER TABLE checklist_nodes_v2
ADD CONSTRAINT IF NOT EXISTS check_item_fields
CHECK (
  (node_type = 'item') OR
  (item_type IS NULL AND severity IS NULL AND check_kind IS NULL)
);

-- Add sort_order index for faster tree queries (if not exists)
CREATE INDEX IF NOT EXISTS checklist_nodes_v2_tree_sort_idx 
ON checklist_nodes_v2(template_version_id, parent_id, sort_order);
