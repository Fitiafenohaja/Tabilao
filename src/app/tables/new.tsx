import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { FieldDefinitionError } from '@/services/fieldRules';
import { createBlankTable, createFromTemplate, type TableCategory } from '@/services/tables';
import { TEMPLATES } from '@/templates';
import {
  Button,
  Card,
  CheckIcon,
  Chip,
  IconTile,
  PlusIcon,
  Screen,
  Section,
  Sheet,
  TableIcon,
  Text,
  TextField,
  categoryVisual,
  iconSize,
  spacing,
  useTheme,
} from '@/ui';

const CATEGORIES: TableCategory[] = ['income', 'expense', 'stock', 'other'];

// Créer un tableau depuis un modèle (A ventes, B dépenses, C stock, D crédits) ou vide.
export default function NewTable() {
  const { t } = useTranslation();
  const { colors } = useTheme();

  const [blankOpen, setBlankOpen] = useState(false);
  const [name, setName] = useState('');
  const [category, setCategory] = useState<TableCategory>('other');
  const [error, setError] = useState<string | null>(null);

  // Le tableau n'est créé qu'une fois nommé : pas de « Nouveau tableau » vide oublié dans la liste.
  const createBlank = () => {
    try {
      const table = createBlankTable(name, category);
      setBlankOpen(false);
      router.replace({ pathname: '/tables/[tableId]/edit', params: { tableId: table.id } });
    } catch (e) {
      setError(e instanceof FieldDefinitionError ? t('tables.nameRequired') : t('errors.generic'));
    }
  };

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
          onPress={() => {
            setName('');
            setCategory('other');
            setError(null);
            setBlankOpen(true);
          }}
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

      <Sheet visible={blankOpen} title={t('tables.blank')} closeLabel={t('common.close')} onClose={() => setBlankOpen(false)}>
        <TextField
          label={t('tables.nameLabel')}
          placeholder={t('tables.namePlaceholder')}
          value={name}
          onChangeText={(v) => {
            setName(v);
            setError(null);
          }}
          error={error ?? undefined}
          autoFocus
          returnKeyType="next"
        />
        <Section title={t('tables.categoryLabel')}>
          <View style={styles.fields}>
            {CATEGORIES.map((c) => (
              <Chip
                key={c}
                icon={category === c ? CheckIcon : categoryVisual(c === 'other' ? null : c).icon}
                label={t(`tables.category.${c}`)}
                selected={category === c}
                onPress={() => setCategory(c)}
              />
            ))}
          </View>
          <Text variant="caption" tone="muted">
            {t('tables.categoryHint')}
          </Text>
        </Section>
        <Button icon={PlusIcon} label={t('tables.create')} disabled={!name.trim()} onPress={createBlank} />
      </Sheet>
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
