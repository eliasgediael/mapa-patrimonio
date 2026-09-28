import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Sparkline } from '../../components/Sparkline';
import {
  Card,
  EmptyState,
  Pill,
  PrimaryButton,
  ProgressBar,
  RoundButton,
  Screen,
  SectionHeader,
  type IconName,
} from '../../components/ui';
import { splitYearsMonths } from '../../engine';
import { formatBRL, formatCompactBRL, formatCountdown, formatMonthLong, formatPercent, relativeTime } from '../../lib/format';
import { useAppState } from '../../lib/AppStateProvider';
import {
  allAccounts,
  buildProjection,
  currentYearMonth,
  goalProgress,
  holdings,
  monthlySurplus,
  netWorthOf,
  waypointHistory,
} from '../../lib/selectors';
import { accountTypeInfo, colors } from '../../theme';

export default function MapScreen() {
  const { state } = useAppState();
  const now = new Date();

  const projection = useMemo(() => buildProjection(state), [state]);
  const netWorth = netWorthOf(allAccounts(state, currentYearMonth(now)));
  const surplus = monthlySurplus(state, currentYearMonth(now));
  const history = waypointHistory(state);
  const last = history[0];
  const owned = holdings(state.accounts);
  const debts = state.accounts.filter((a) => a.type === 'debt');
  const next12 = projection.slice(0, 13).map((s) => s.netWorth);
  const in12 = next12[next12.length - 1] ?? netWorth;

  return (
    <Screen
      title="Mapa"
      right={<RoundButton icon="flash" label="Fazer check-in" onPress={() => router.push('/checkin')} />}
    >
      {/* Patrimônio líquido */}
      <View style={s.hero}>
        <Text style={s.heroLabel}>PATRIMÔNIO LÍQUIDO</Text>
        <Text style={s.heroValue} adjustsFontSizeToFit numberOfLines={1}>
          {formatBRL(netWorth, { cents: false })}
        </Text>
        <Pill
          text={`Sobra no mês  ${surplus >= 0 ? '↗' : '↘'} ${formatBRL(surplus, { cents: false })}`}
          color={surplus >= 0 ? colors.accent : colors.red}
          bg={colors.card}
          style={{ alignSelf: 'center' }}
        />
      </View>

      {state.accounts.length === 0 ? (
        <Card style={{ marginTop: 24 }}>
          <EmptyState
            icon="map-outline"
            title="Comece o seu mapa"
            text="Cadastre suas contas, investimentos, bens e dívidas. Depois é só fazer um check-in de 2 minutos quando quiser."
          />
          <PrimaryButton label="Adicionar primeira conta" icon="add" onPress={() => router.push('/account/new')} />
        </Card>
      ) : (
        <>
          {/* Próximos 12 meses */}
          <SectionHeader title="PRÓXIMOS 12 MESES" />
          <Card>
            <Sparkline values={next12} />
            <View style={s.rowBetween}>
              <View>
                <Text style={s.small}>Hoje</Text>
                <Text style={s.smallValue}>{formatCompactBRL(netWorth)}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={s.small}>{projection[12] ? formatMonthLong(projection[12].month) : ''}</Text>
                <Text style={[s.smallValue, { color: in12 >= netWorth ? colors.accent : colors.red }]}>
                  {formatCompactBRL(in12)}
                </Text>
              </View>
            </View>
            <Text style={s.footnote}>
              {state.settings.valueMode === 'real' ? 'Em dinheiro de hoje (descontada a inflação)' : 'Em valores nominais'}
            </Text>
          </Card>

          {/* Check-ins */}
          <SectionHeader title="CHECK-INS" />
          <Card onPress={() => router.push('/checkin')} style={s.waypoint}>
            <View style={s.waypointIcon}>
              <Ionicons name="checkmark" size={20} color="#04140D" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.itemTitle}>Registrar check-in</Text>
              <Text style={s.itemSub}>{last ? `Último check-in: ${relativeTime(last.date)}` :'Atualize seus saldos em 2 minutos'}</Text>
            </View>
            {last?.change != null && (
              <Text style={[s.change, { color: last.change >= 0 ? colors.accent : colors.red }]}>
                {last.change >= 0 ? '↗' : '↘'} {formatBRL(last.change, { cents: false })}
              </Text>
            )}
            {history.length > 0 && (
              <View style={s.badge}>
                <Text style={s.badgeText}>{history.length}</Text>
              </View>
            )}
          </Card>

          {/* Metas */}
          <SectionHeader title="SUA ESTRELA-GUIA" action={{ label: '+ Meta', onPress: () => router.push('/goal/new') }} />
          {state.goals.length === 0 ? (
            <Card onPress={() => router.push('/goal/new')}>
              <Text style={s.itemTitle}>Defina uma meta</Text>
              <Text style={s.itemSub}>Ex.: R$ 1 milhão de patrimônio. O app calcula quando você chega lá.</Text>
            </Card>
          ) : (
            <View style={{ gap: 10 }}>
              {state.goals.map((goal) => {
                const g = goalProgress(state, goal, now, projection);
                const eta = g.eta ? splitYearsMonths(g.eta.monthsFromNow) : null;
                return (
                  <Card key={goal.id} onPress={() => router.push(`/goal/${goal.id}`)}>
                    <View style={s.rowBetween}>
                      <Text style={s.itemTitle}>{goal.name}</Text>
                      <Pill
                        text={eta ? formatCountdown(eta.years, eta.months) : '+40 anos'}
                        color={eta ? colors.accent : colors.red}
                        bg={eta ? colors.accentSoft : colors.redSoft}
                      />
                    </View>
                    <View style={{ marginTop: 12 }}>
                      <ProgressBar value={g.progress} />
                    </View>
                    <View style={[s.rowBetween, { marginTop: 8 }]}>
                      <Text style={s.small}>{formatCompactBRL(g.current)}</Text>
                      <Text style={s.small}>{formatPercent(g.progress)}</Text>
                      <Text style={s.small}>
                        {g.eta && g.eta.monthsFromNow > 0 ? `${formatMonthLong(g.eta.month)} · ` : ''}
                        {formatCompactBRL(goal.targetAmount)}
                      </Text>
                    </View>
                  </Card>
                );
              })}
            </View>
          )}

          {/* O que você tem */}
          <SectionHeader title="O QUE VOCÊ TEM" action={{ label: '+ Conta', onPress: () => router.push('/account/new') }} />
          <Card style={{ paddingVertical: 4 }}>
            {owned.length === 0 && <Text style={[s.itemSub, { paddingVertical: 12 }]}>Nenhum bem cadastrado.</Text>}
            {owned.map((h, i) => (
              <AccountRow
                key={h.account.id}
                id={h.account.id}
                name={h.account.name}
                icon={accountTypeInfo[h.account.type].icon as IconName}
                color={accountTypeInfo[h.account.type].color}
                value={formatCompactBRL(h.account.balance)}
                extra={formatPercent(h.share)}
                divider={i > 0}
              />
            ))}
          </Card>

          {debts.length > 0 && (
            <>
              <SectionHeader title="O QUE VOCÊ DEVE" />
              <Card style={{ paddingVertical: 4 }}>
                {debts.map((d, i) => (
                  <AccountRow
                    key={d.id}
                    id={d.id}
                    name={d.name}
                    icon="card"
                    color={colors.red}
                    value={formatCompactBRL(d.balance)}
                    extra={d.monthlyPayment ? `${formatCompactBRL(d.monthlyPayment)}/mês` : undefined}
                    divider={i > 0}
                  />
                ))}
              </Card>
            </>
          )}
        </>
      )}
    </Screen>
  );
}

function AccountRow(props: {
  id: string;
  name: string;
  icon: IconName;
  color: string;
  value: string;
  extra?: string;
  divider: boolean;
}) {
  return (
    <Card
      onPress={() => router.push(`/account/${props.id}`)}
      style={[s.accountRow, props.divider && s.divider]}
    >
      <Ionicons name={props.icon} size={18} color={props.color} />
      <Text style={[s.itemTitle, { flex: 1 }]} numberOfLines={1}>
        {props.name}
      </Text>
      <Text style={[s.accountValue, { color: props.color }]}>{props.value}</Text>
      {props.extra && <Pill text={props.extra} />}
    </Card>
  );
}

const s = StyleSheet.create({
  hero: { alignItems: 'center', marginTop: 18, gap: 6 },
  heroLabel: { color: colors.muted, fontSize: 12, fontWeight: '700', letterSpacing: 1.2 },
  heroValue: { color: colors.text, fontSize: 44, fontWeight: '700', marginBottom: 6 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  small: { color: colors.muted, fontSize: 12 },
  smallValue: { color: colors.text, fontSize: 15, fontWeight: '600', marginTop: 2 },
  footnote: { color: colors.dim, fontSize: 11, marginTop: 10 },
  itemTitle: { color: colors.text, fontSize: 16, fontWeight: '600' },
  itemSub: { color: colors.muted, fontSize: 13, marginTop: 3 },
  waypoint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#0E2A20',
    borderColor: '#1F5A43',
  },
  waypointIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  change: { fontSize: 13, fontWeight: '700' },
  badge: {
    minWidth: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  badgeText: { color: '#04140D', fontSize: 12, fontWeight: '800' },
  accountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'transparent',
    borderWidth: 0,
    borderRadius: 0,
    paddingHorizontal: 0,
    paddingVertical: 14,
  },
  divider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
  accountValue: { fontSize: 15, fontWeight: '700' },
});
