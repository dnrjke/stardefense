import { FlowController } from '@/app/FlowController';
import { generateAppIcon } from '@/shared/ui/AppIcon';

function main() {
  const canvas = document.getElementById('renderCanvas') as HTMLCanvasElement;
  if (!canvas) return;

  generateAppIcon();

  const flow = new FlowController(canvas);
  flow.showMapSelect();
}

main();
