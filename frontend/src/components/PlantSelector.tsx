import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { plantConfigs, PlantConfig } from "@/data/plantConfigs";

interface PlantSelectorProps {
  selectedPlant: PlantConfig;
  onPlantChange: (plantId: string) => void;
}

export const PlantSelector = ({ selectedPlant, onPlantChange }: PlantSelectorProps) => {
  return (
    <Select value={selectedPlant.id} onValueChange={onPlantChange}>
      <SelectTrigger className="w-64 bg-muted/50 border-border">
        <SelectValue>
          <div className="flex items-center gap-2">
            <span className="text-lg">{selectedPlant.icon}</span>
            <span className="font-medium">{selectedPlant.name}</span>
          </div>
        </SelectValue>
      </SelectTrigger>
      <SelectContent className="bg-card border-border">
        {plantConfigs.map((config) => (
          <SelectItem 
            key={config.id} 
            value={config.id}
            className="hover:bg-muted/50 focus:bg-muted/50"
          >
            <div className="flex items-center gap-2">
              <span className="text-lg">{config.icon}</span>
              <span className="font-medium">{config.name}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};