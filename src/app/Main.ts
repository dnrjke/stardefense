import { FlowController } from '@/app/FlowController';

function main() {
  const canvas = document.getElementById('renderCanvas') as HTMLCanvasElement;
  if (!canvas) return;

  const flow = new FlowController(canvas);
  flow.showMapSelect();
}

main();
