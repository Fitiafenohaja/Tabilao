import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { createFromTemplate } from '@/services/tables';
import { TEMPLATES } from '@/templates';
import { Card, IconTile, PlusIcon, Screen, Section, TableIcon, Text, categoryVisual, iconSize, spacing, useTheme } from '@/ui';

// Créer un tableau depuis un modèle (A ventes, B dépenses, C stock, D crédits) ou sur mesure.
export default function NewTable() {
  const { t } = useTranslation();
  const { colors } = useTheme();

  return (
    <Screen>
      <Section title={t('tables.fromTemplate')}>
        {TEMPLATES.map((template) => {
          const visual = categoryVisual(template.category);
          return (
            <Card
              key={template.id}
              style={styles.card}
              accessibilityLabel={t(template.nameKey)}
              onPress={() => {
                const table = createFromTemplate(template, t(template.nameKey));
                router.replace({ pathname: '/tables/[tableId]', params: { tableId: table.id } });
              }}
            >
              <IconTile icon={visual.icon} bg={visual.bg} fg={visual.fg} size="lg" />
              <View style={styles.text}>
                <Text variant="heading">{t(template.nameKey)}</Text>
                <View style={styles.fields}>
                  {template.fields.map((f) => (
                    <View key={f.name} style={[styles.field, { backgroundColor: colors.neutralSoft }]}>
                      <Text variant="caption" tone="muted">
                        {f.type === 'formula' ? `= ${f.name}` : f.name}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            </Card>
          );
        })}
      </Section>

      <Section>
        <Card
          style={[styles.card, styles.blank, { borderColor: colors.primary }]}
          accessibilityLabel={t('tables.blank')}
          onPress={() => router.push('/tables/create')}
        >
          <IconTile icon={TableIcon} />
          <View style={styles.text}>
            <Text variant="heading">{t('tables.blank')}</Text>
            <Text variant="caption" tone="muted">
              {t('tables.blankHint')}
            </Text>
          </View>
          <PlusIcon size={iconSize.md} color={colors.primary} weight="bold" />
        </Card>
      </Section>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  blank: { borderStyle: 'dashed', borderWidth: 1.5 },
  text: { flex: 1, gap: spacing.xs },
  fields: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  field: { borderRadius: 999, paddingHorizontal: spacing.sm, paddingVertical: 2 },
});
