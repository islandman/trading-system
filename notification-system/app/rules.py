import logging
from typing import List, Dict, Any, Optional

logger = logging.getLogger(__name__)

class RulesEngine:
    """Engine for processing notification rules"""
    
    def __init__(self):
        self.rules = []
    
    def load_rules(self, rules_config: dict):
        """Load rules from configuration"""
        try:
            self.rules = rules_config.get("rules", [])
            logger.info(f"Loaded {len(self.rules)} notification rules")
        except Exception as e:
            logger.error(f"Error loading rules: {e}")
            self.rules = []
    
    async def apply_rules(self, event_data: dict) -> List[Dict[str, Any]]:
        """Apply rules to an event and return matching actions"""
        matching_actions = []
        
        try:
            for rule in self.rules:
                if await self._evaluate_rule(rule, event_data):
                    logger.info(f"Rule '{rule.get('name', 'Unknown')}' matched for event {event_data.get('type')}")
                    matching_actions.extend(rule.get("actions", []))
            
            return matching_actions
            
        except Exception as e:
            logger.error(f"Error applying rules: {e}")
            return []
    
    async def _evaluate_rule(self, rule: dict, event_data: dict) -> bool:
        """Evaluate if a rule matches the event"""
        try:
            # Check event type
            if rule.get("event_type") != event_data.get("type"):
                return False
            
            # Check conditions
            conditions = rule.get("conditions", [])
            if not conditions:
                return True  # No conditions means always match
            
            for condition in conditions:
                if not await self._evaluate_condition(condition, event_data):
                    return False
            
            return True
            
        except Exception as e:
            logger.error(f"Error evaluating rule: {e}")
            return False
    
    async def _evaluate_condition(self, condition: dict, event_data: dict) -> bool:
        """Evaluate a single condition"""
        try:
            field = condition.get("field")
            operator = condition.get("operator")
            value = condition.get("value")
            
            if not field or not operator:
                return False
            
            # Get field value from event data
            field_value = self._get_field_value(field, event_data)
            
            # Apply operator
            return self._apply_operator(field_value, operator, value)
            
        except Exception as e:
            logger.error(f"Error evaluating condition: {e}")
            return False
    
    def _get_field_value(self, field: str, event_data: dict) -> Any:
        """Get field value from event data"""
        # Handle nested fields (e.g., "payload.user_id")
        if "." in field:
            parts = field.split(".")
            value = event_data
            for part in parts:
                if isinstance(value, dict) and part in value:
                    value = value[part]
                else:
                    return None
            return value
        else:
            return event_data.get(field)
    
    def _apply_operator(self, field_value: Any, operator: str, expected_value: Any) -> bool:
        """Apply comparison operator"""
        try:
            if operator == "eq":
                return field_value == expected_value
            elif operator == "ne":
                return field_value != expected_value
            elif operator == "gt":
                return field_value > expected_value
            elif operator == "gte":
                return field_value >= expected_value
            elif operator == "lt":
                return field_value < expected_value
            elif operator == "lte":
                return field_value <= expected_value
            elif operator == "in":
                return field_value in expected_value
            elif operator == "not_in":
                return field_value not in expected_value
            elif operator == "contains":
                return expected_value in field_value
            elif operator == "not_contains":
                return expected_value not in field_value
            elif operator == "regex":
                import re
                return bool(re.search(expected_value, str(field_value)))
            else:
                logger.warning(f"Unknown operator: {operator}")
                return False
                
        except Exception as e:
            logger.error(f"Error applying operator {operator}: {e}")
            return False
    
    def add_rule(self, rule: dict):
        """Add a new rule"""
        self.rules.append(rule)
        logger.info(f"Added rule: {rule.get('name', 'Unknown')}")
    
    def remove_rule(self, rule_name: str) -> bool:
        """Remove a rule by name"""
        for i, rule in enumerate(self.rules):
            if rule.get("name") == rule_name:
                del self.rules[i]
                logger.info(f"Removed rule: {rule_name}")
                return True
        return False
    
    def get_rules(self) -> List[dict]:
        """Get all rules"""
        return self.rules
    
    def get_rule_by_name(self, rule_name: str) -> Optional[dict]:
        """Get a rule by name"""
        for rule in self.rules:
            if rule.get("name") == rule_name:
                return rule
        return None
    
    def validate_rule(self, rule: dict) -> bool:
        """Validate a rule structure"""
        try:
            required_fields = ["name", "event_type", "actions"]
            for field in required_fields:
                if field not in rule:
                    logger.error(f"Missing required field: {field}")
                    return False
            
            # Validate actions
            actions = rule.get("actions", [])
            for action in actions:
                if not self._validate_action(action):
                    return False
            
            # Validate conditions
            conditions = rule.get("conditions", [])
            for condition in conditions:
                if not self._validate_condition(condition):
                    return False
            
            return True
            
        except Exception as e:
            logger.error(f"Error validating rule: {e}")
            return False
    
    def _validate_action(self, action: dict) -> bool:
        """Validate an action"""
        try:
            if action.get("type") != "notify":
                logger.error("Only 'notify' actions are supported")
                return False
            
            if "channels" not in action:
                logger.error("Action missing 'channels' field")
                return False
            
            if "template" not in action:
                logger.error("Action missing 'template' field")
                return False
            
            return True
            
        except Exception as e:
            logger.error(f"Error validating action: {e}")
            return False
    
    def _validate_condition(self, condition: dict) -> bool:
        """Validate a condition"""
        try:
            required_fields = ["field", "operator", "value"]
            for field in required_fields:
                if field not in condition:
                    logger.error(f"Condition missing required field: {field}")
                    return False
            
            valid_operators = ["eq", "ne", "gt", "gte", "lt", "lte", "in", "not_in", "contains", "not_contains", "regex"]
            if condition.get("operator") not in valid_operators:
                logger.error(f"Invalid operator: {condition.get('operator')}")
                return False
            
            return True
            
        except Exception as e:
            logger.error(f"Error validating condition: {e}")
            return False
