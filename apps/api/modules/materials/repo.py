"""
Materials Repository - Data Access Layer
Handles all database operations for materials module
"""

from typing import List, Dict, Optional
from datetime import datetime


class MaterialsRepository:
    """
    Repository pattern implementation for materials database operations.
    All DB queries go through this layer.
    """
    
    def __init__(self, db_client):
        self.db = db_client
    
    async def add_material(
        self,
        name: str,
        description: str,
        unit: str,
        category: str,
        reorder_point: int,
        supplier_id: Optional[str] = None
    ) -> Dict:
        """
        Insert a new material into materials table.
        """
        query = """
        INSERT INTO materials (name, description, unit, category, reorder_point, supplier_id, current_stock, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, 0, NOW())
        RETURNING id, created_at
        """
        
        # TODO: Execute query and return result
        return {"id": "mat_123", "created_at": datetime.utcnow()}
    
    async def get_material_by_id(self, material_id: str) -> Optional[Dict]:
        """Retrieve a material by ID"""
        query = "SELECT * FROM materials WHERE id = $1"
        # TODO: Execute query
        return None
    
    async def update_stock(
        self,
        material_id: str,
        quantity_change: float,
        transaction_type: str,
        reference_id: str,
        notes: Optional[str] = None
    ) -> Dict:
        """Update material stock and create transaction record"""
        query = """
        WITH stock_update AS (
            UPDATE materials 
            SET current_stock = current_stock + $2, updated_at = NOW()
            WHERE id = $1
            RETURNING current_stock
        ),
        transaction_record AS (
            INSERT INTO material_transactions (material_id, quantity_change, transaction_type, reference_id, notes, created_at)
            VALUES ($1, $2, $3, $4, $5, NOW())
        )
        SELECT * FROM stock_update;
        """
        # TODO: Execute query
        return {"new_stock": 100.0}
    
    async def check_reorder_alerts(self) -> List[Dict]:
        """Get materials below reorder point"""
        query = """
        SELECT id, name, current_stock, reorder_point, supplier_id
        FROM materials
        WHERE current_stock <= reorder_point
        ORDER BY (reorder_point - current_stock) DESC
        """
        # TODO: Execute query
        return []
    
    async def allocate_to_project(
        self,
        material_id: str,
        project_id: str,
        quantity: float
    ) -> Dict:
        """Allocate material to project (reduce available stock)"""
        query = """
        UPDATE materials 
        SET current_stock = current_stock - $3, updated_at = NOW()
        WHERE id = $1 AND current_stock >= $3
        RETURNING current_stock
        """
        # TODO: Execute query and create allocation record
        return {"status": "allocated"}
    
    async def get_inventory_report(self) -> Dict:
        """Generate inventory summary"""
        # TODO: Complex aggregation query
        return {"total_materials": 0}
    
    async def get_materials_by_category(self, category: str) -> List[Dict]:
        """Get materials in a specific category"""
        query = "SELECT * FROM materials WHERE category = $1 ORDER BY name"
        # TODO: Execute query
        return []
    
    async def get_stock_transactions(
        self,
        material_id: str,
        limit: int = 50
    ) -> List[Dict]:
        """Get stock transaction history for a material"""
        query = """
        SELECT * FROM material_transactions 
        WHERE material_id = $1 
        ORDER BY created_at DESC 
        LIMIT $2
        """
        # TODO: Execute query
        return []


def get_materials_repository(db_client):
    """Factory function for repository"""
    return MaterialsRepository(db_client)
