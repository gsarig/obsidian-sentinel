# Sentinel

Sentinel is a plugin for [Obsidian](https://obsidian.md) that allows you to **update properties** or **run commands** based on document visibility changes. For example, you can add a `views` property that auto-increments every time a Note opens, a `modified` property that captures the current datetime when you exit a Note with modifications, run a Linter when a Note opens or exits, and so on. 

https://github.com/user-attachments/assets/eb7f4ae7-2448-4ca1-913a-9b63d799f8bf

## How to use
Go to the plugin's settings to add your actions. Each action includes the following fields:
* **Where**: Which notes should be targeted. If left empty, it will run on all Notes. You can target a specific Note by providing the Note's full title, or use a regex to target Notes with specific patterns on their title (example: `/^Recipe-*.*/` would target all notes with a title beginning with "Recipe-").
* **When**: When should the action run. The options include:
	* **Opening a note**: The action will run every time a Note is being opened. 
    * **Opening a note (once)**: The action will run the first time a note opens, but not for any consecutive times. 
    * **Exiting a note (once)**: The action will run when the user exits a note for the first time.
    * **Exiting a note with changes**: The action will run every time the user exits a note after having done changes to it. 
* **What**: What should the action do. There are two options:
  * **Set a property**: You can update a specific property. By selecting this option, you will be asked to add the property's name, and the value. The value can either be a hardcoded string, or a dynamic variable, like `{{increment}}`, `{{date}}`, `{{time}}` or `{{title}}`. 
  * **Execute a command**: This will ask you to select a specific command from a dropdown, which will be automatically triggered. The list includes all the available commands from the Command Palette, so you should make sure to choose something that makes sense.  

![obsidian-sentinel.png](.github/assets/obsidian-sentinel.png)

## Available variables
The property option accepts the following dynamic variables:
### Date/time
Both `{{date}}` and `{{time}}` allow you to change the default format using a format string. To set a format string, add a colon (:) followed by a string of Moment.js format tokens, for example `{{date:YYYY-MM-DD}}`.

You can use `{{date}}` and `{{time}}` interchangeably with format strings, for example `{{time:YYYY-MM-DD}}`.

Essentially, it follows the same patterns described in the [Template variables](https://help.obsidian.md/Plugins/Templates#Template+variables) section of the Obsidian Help pages. 

### Increment
Using `{{increment}}` you can increment a specific value. This can be handy if you want to add a property for tracking the views of a Note. The variable allows you to set the starting value and the increment step, with the following pattern: `{{increment:<initial_value>,<increment_step>}}`. For example, `{{increment:100,10}}`, would use "100" as its initial value, and increment by "10" (so, on your next visit, the value should be "110", then "120" and so on). 

If no other parameters are used, it will use by default "0" as the initial value and "1" as the increment step. 

### Title
You can use `{{title}}` to retrieve the title of the active note. Nothing fancy here, and I'm not sure when would one need it. I just kept it because it was among the officially supported [Template variables](https://help.obsidian.md/Plugins/Templates#Template+variables).

## How to install
Currently, there are 2 ways to install the plugin:

### Using BRAT
1. Install the [BRAT](https://github.com/TfTHacker/obsidian42-brat) plugin.
2. Add the Sentinel repository to BRAT: `gsarig/obsidian-sentinel`.

### Manually
1. Downlaod `main.js`, `styles.css`, `manifest.json` files from the [latest release](https://github.com/gsarig/obsidian-sentinel/releases).
2. Create new folder inside your vault's `/.obsidian/plugins/` named  `sentinel` . If plugins folder doesn't exist, then create it manually. 
3. Move downloaded files into the `/sentinel` folder. 
4. Enable the plugin in ObsidianMD. 

## Feedback and Support

If you encounter any issues or have questions, feel free to reach out via the plugin's [GitHub repository](https://github.com/gsarig/obsidian-sentinel/).
