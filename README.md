# MouseWord

MouseWord is a tool that makes learning vocabulary easy. When you're reading an
online text in the language that you're learning, as a beginner you might often
find yourself using google translate or online dictionaries to translate unfamiliar
words. This can significantly slow down your reading and make it very tedious.

That's where MouseWord comes in. It allows you to translate words on a
website just by hovering with your cursor over them for a second.

## Installation

First you need to install Tampermonkey / Greasemonkey browser extension. Then you
open the extension's dashboard and click on the button with the + sign, designated for
creating a new script. After doing so you copy paste the contents of file "mouseword.js"
from this repository and save.

Alternatively, you can just download the script and copy paste its contents into the
browser's JavaScript console. However, this would need to be repeated every time you refresh
or open a new tab.

## How to use

When you open a website in your browser you'll notice a rectange with rounded edges in
the top right angle of your screen. When you click on it you'll see an on/off switch and
a dropdown menu for selecting the language you want to translate from. After turning on
the on/off switch, you'll be able to hover over words and see their translations almost
instantly.

## Additional information

This tool uses *wordreference.com* to find translations for words. Due to that, only the
languages available on *wordreference.com* will be available for translation.
