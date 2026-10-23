import { View } from 'react-native';

import { CheckStep } from '@/features/import/steps/CheckStep';
import { FileStep } from '@/features/import/steps/FileStep';
import { MappingStep } from '@/features/import/steps/MappingStep';
import { ReportStep } from '@/features/import/steps/ReportStep';
import { StepIndicator } from '@/features/import/steps/StepIndicator';
import { useImportWizard } from '@/features/import/importStore';

const SCREENS = { file: FileStep, mapping: MappingStep, check: CheckStep, report: ReportStep };

// Assistant d'import Excel / CSV (cahier des charges §5.9, étapes 1 à 10).
export default function ImportWizard() {
  const step = useImportWizard((s) => s.step);
  const Step = SCREENS[step];
  return (
    <View style={{ flex: 1 }}>
      <StepIndicator step={step} />
      <Step />
    </View>
  );
}
