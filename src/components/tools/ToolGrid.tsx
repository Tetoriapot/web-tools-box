import type { ToolDefinition } from '../../data/tools';
import { ToolCard } from './ToolCard';

export function ToolGrid({ tools }: { tools: ToolDefinition[] }) {
  return (
    <div className="tool-grid">
      {tools.map((tool) => (
        <ToolCard key={tool.id} tool={tool} />
      ))}
    </div>
  );
}
