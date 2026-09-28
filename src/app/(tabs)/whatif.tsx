import { Card, EmptyState, Screen } from '../../components/ui';

// Fase 3: "Devo comprar isso?" e cenários "E se?".
export default function WhatIfScreen() {
  return (
    <Screen title="E se?">
      <Card style={{ marginTop: 16 }}>
        <EmptyState
          icon="help-circle-outline"
          title="Em construção (Fase 3)"
          text={'"Devo comprar isso?" e cenários como trocar de emprego, ter um filho ou comprar um carro.'}
        />
      </Card>
    </Screen>
  );
}
