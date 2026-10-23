import { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { Pressable, StyleSheet, View } from 'react-native';

import { formatDate } from '@/i18n/format';
import { fromIsoDate, isoDaysFromToday, toIsoDate } from '@/services/dates';

import { CalendarBlankIcon, WarningIcon } from '../icons';
import { useTheme } from '../ThemeProvider';
import { iconSize, radius, spacing } from '../theme';
import { Chip } from './Chip';
import { Text } from './Text';

type Props = {
  label: string;
  value: unknown;
  onChange: (iso: string) => void;
  required?: boolean;
  error?: string;
  labels: { choose: string; today: string; yesterday: string };
};

/** Date : calendrier natif d'Android + raccourcis « Aujourd'hui » / « Hier ». Rien à taper. */
export function DateField({ label, value, onChange, required = false, error, labels }: Props) {
  const { colors } = useTheme();
  const iso = typeof value === 'string' && fromIsoDate(value) ? value : null;
  const today = isoDaysFromToday(0);
  const yesterday = isoDaysFromToday(-1);

  const open = () =>
    DateTimePickerAndroid.open({
      value: fromIsoDate(iso) ?? new Date(),
      mode: 'date',
      onChange: (event, date) => {
        if (event.type === 'set' && date) onChange(toIsoDate(date));
      },
    });

  return (
    <View style={styles.wrapper}>
      <Text variant="label" tone="muted">
        {label}
        {required ? <Text variant="label" tone="danger"> *</Text> : null}
      </Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${label} : ${iso ? formatDate(iso, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : labels.choose}`}
        accessibilityHint={error}
        onPress={open}
        style={({ pressed }) => [
          styles.box,
          {
            backgroundColor: pressed ? colors.primaryTint : colors.card,
            borderColor: error ? colors.danger : colors.border,
            borderWidth: error ? 2 : 1,
          },
        ]}
      >
        <Text variant="body" tone={iso ? 'default' : 'muted'} style={{ flex: 1 }}>
          {iso ? formatDate(iso, { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' }) : labels.choose}
        </Text>
        <CalendarBlankIcon size={iconSize.md} color={colors.primary} />
      </Pressable>
      <View style={styles.chips}>
        <Chip label={labels.today} selected={iso === today} onPress={() => onChange(today)} />
        <Chip label={labels.yesterday} selected={iso === yesterday} onPress={() => onChange(yesterday)} />
      </View>
      {error ? (
        <View style={styles.message} accessibilityLiveRegion="polite">
          <WarningIcon size={iconSize.sm - 4} color={colors.danger} weight="fill" />
          <Text variant="caption" tone="danger" style={{ flex: 1 }}>
            {error}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: spacing.xs },
  box: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, minHeight: 52, borderRadius: radius.field, paddingHorizontal: spacing.md },
  chips: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs },
  message: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
});
