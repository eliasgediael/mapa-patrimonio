import { Card, EmptyState, Screen } from '../../components/ui';

// Fase 3: gráfico de projeção 5/10/20/25/50 anos com Caixa, Investimentos, Bens e Dívidas.
export default function ForecastScreen() {
  return (
    <Screen title="Projeção">
      <Card style={{ marginTop: 16 }}>
        <EmptyState
          icon="analytics-outline"
          title="Em construção (Fase 3)"
          text="Aqui vai o gráfico do seu patrimônio para 5, 10, 20 e 50 anos, com as metas marcadas na linha do tempo."
        />
      </Card>
    </Screen>
  );
}
