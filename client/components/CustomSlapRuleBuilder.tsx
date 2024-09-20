import React, { useState } from 'react';
import { Box, Button, Group, Select, TextInput, Text, Paper, MultiSelect } from '@mantine/core';
import { ICondition, SlapRule, SlapRuleAction } from '../types';

interface CustomSlapRuleBuilderProps {
  onSaveRule: (rule: SlapRule) => void;
}

export const CustomSlapRuleBuilder: React.FC<CustomSlapRuleBuilderProps> = ({ onSaveRule }) => {
  const [ruleName, setRuleName] = useState('');
  const [conditions, setConditions] = useState<string[]>([]);
  const [operators, setOperators] = useState<string[]>([]);
  const [values, setValues] = useState<(string | number)[][]>([]);

  const addCondition = () => {
    setConditions([...conditions, 'pile.length === 2']);
    setOperators([...operators, '===']);
    setValues([...values, [2]]);
  };

  const updateConditionField = (index: number, field: string) => {
    const operator = operators[index];
    const value = values[index];
    const newCondition = `${field} ${operator} ${operator === 'in' ? JSON.stringify(value) : value}`;
    const newConditions = [...conditions];
    newConditions[index] = newCondition;
    setConditions(newConditions);
  };

  const updateConditionOperator = (index: number, operator: string) => {
    const field = conditions[index].split(' ')[0];
    const value = operators[index] === 'in' ? values[index] : conditions[index].split(' ').slice(2).join(' ');
    const newCondition = operator === 'in' ? `${field} ${operator} []` : `${field} ${operator} ${value}`;
    const newConditions = [...conditions];
    newConditions[index] = newCondition;
    setConditions(newConditions);
    setOperators(operators.map((op, i) => (i === index ? operator : op)));
    if (operator !== 'in') {
      setValues(values.map((val, i) => (i === index ? [val[0]] : val)));
    }
  };

  const updateConditionValue = (index: number, value: string | string[]) => {
    if (operators[index] === 'in') {
      const parsedValues = Array.isArray(value) ? value : value.split(',').map((v) => v.trim());
      setValues(values.map((val, i) => (i === index ? parsedValues : val)));
      const newCondition = `${conditions[index].split(' ')[0]} ${operators[index]} ${JSON.stringify(parsedValues)}`;
      setConditions(conditions.map((cond, i) => (i === index ? newCondition : cond)));
    } else {
      const newCondition = `${conditions[index].split(' ')[0]} ${operators[index]} ${value}`;
      setConditions(conditions.map((cond, i) => (i === index ? newCondition : cond)));
      // Convert value to string to ensure consistency
      const stringValue = String(value);
      setValues(values.map((val, i) => (i === index ? [stringValue] : val)));
    }
  };

  const removeCondition = (index: number) => {
    const newConditions = conditions.filter((_, i) => i !== index);
    const newOperators = operators.filter((_, i) => i !== index);
    const newValues = values.filter((_, i) => i !== index);
    setConditions(newConditions);
    setOperators(newOperators);
    setValues(newValues);
  };

  const saveRule = () => {
    const parsedConditions: ICondition[] = conditions.map((cond, index) => {
      const [field, operator, ...valueParts] = cond.split(' ');
      if (operator === 'in') {
        const value = JSON.parse(valueParts.join(' '));
        return {
          field: field as ICondition['field'],
          operator: operator as ICondition['operator'],
          value: value,
        };
      } else {
        const value = valueParts.join(' ');
        return {
          field: field as ICondition['field'],
          operator: operator as ICondition['operator'],
          value: isNaN(Number(value)) ? value : Number(value),
        };
      }
    });

    const newRule: SlapRule = {
      name: ruleName,
      conditions: parsedConditions,
      action: SlapRuleAction.TAKE_PILE,
    };

    onSaveRule(newRule);
    setRuleName('');
    setConditions([]);
    setOperators([]);
    setValues([]);
  };

  return (
    <Paper p="md" withBorder>
      <TextInput label="Rule Name" value={ruleName} onChange={(e) => setRuleName(e.currentTarget.value)} mb="md" />
      {conditions.map((condition, index) => (
        <Group key={index} mb="sm">
          <Select
            style={{ flex: 1 }}
            data={[
              { value: 'pile.length', label: 'Pile Length' },
              { value: 'pile[0].rank', label: 'Top Card Rank' },
              { value: 'pile[1].rank', label: 'Second Card Rank' },
              { value: 'currentPlayer', label: 'Current Player' },
              { value: 'currentPlayer.name', label: 'Current Player Name' },
            ]}
            placeholder="Select condition"
            value={conditions[index].split(' ')[0]}
            onChange={(value) => updateConditionField(index, value || 'pile.length')}
          />
          <Select
            style={{ flex: 1 }}
            data={[
              { value: '===', label: 'Equals' },
              { value: '!==', label: 'Not Equals' },
              { value: '>', label: 'Greater Than' },
              { value: '<', label: 'Less Than' },
              { value: '>=', label: 'Greater Than or Equal' },
              { value: '<=', label: 'Less Than or Equal' },
              { value: 'in', label: 'In' },
            ]}
            placeholder="Select operator"
            value={operators[index]}
            onChange={(value) => updateConditionOperator(index, value || '===')}
          />
          {operators[index] === 'in' ? (
            <MultiSelect
              style={{ flex: 1 }}
              data={[
                { value: 'A', label: 'A' },
                { value: '2', label: '2' },
                { value: '3', label: '3' },
                { value: '4', label: '4' },
                { value: '5', label: '5' },
                { value: '6', label: '6' },
                { value: '7', label: '7' },
                { value: '8', label: '8' },
                { value: '9', label: '9' },
                { value: '10', label: '10' },
                { value: 'J', label: 'J' },
                { value: 'Q', label: 'Q' },
                { value: 'K', label: 'K' },
              ]}
              placeholder="Select values"
              value={values[index].map(String)}
              onChange={(selected) => updateConditionValue(index, selected)}
            />
          ) : (
            <TextInput
              style={{ flex: 1 }}
              placeholder="Enter value"
              value={operators[index] !== undefined ? conditions[index].split(' ').slice(2).join(' ') : ''}
              onChange={(e) => updateConditionValue(index, e.currentTarget.value)}
            />
          )}
          <Button color="red" onClick={() => removeCondition(index)}>
            Remove
          </Button>
        </Group>
      ))}
      <Group mt="md">
        <Button onClick={addCondition}>Add Condition</Button>
        <Button onClick={saveRule} disabled={!ruleName || conditions.length === 0}>
          Save Rule
        </Button>
      </Group>
      <Box mt="md">
        <Text>Preview:</Text>
        <Text>{conditions.join(' && ') || 'No conditions set'}</Text>
      </Box>
    </Paper>
  );
};
