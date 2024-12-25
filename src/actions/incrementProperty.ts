import { TFile, App, Notice } from "obsidian";
import { getLabel } from '../utils/getLabel';
import { propertyUpdater } from '../handlers/propertyUpdater';

export async function incrementProperty(
  file: TFile,
   app: App,
   propertyName?: string,
   step = 1
): Promise<void> {
   if (!app?.vault) {
       new Notice(getLabel('invalidAppInstance'));
       return;
   }

   if (!propertyName) return;

   await propertyUpdater(
       file,
       app,
       propertyName,
       value => (Number(value) || 0) + step
   );
}

// await incrementProperty(file, app, 'view_count', 10);
