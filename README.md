# Arcanist [![Node.js CI](https://github.com/kbsletten/Arcanist/actions/workflows/node.js.yml/badge.svg)](https://github.com/kbsletten/Arcanist/actions/workflows/node.js.yml)

A Discord bot for the [Shadowdark RPG](https://www.thearcanelibrary.com/pages/shadowdark).

## How to Use

To add Arcanist to your discord server, [click here](https://discord.com/api/oauth2/authorize?client_id=1121532418738901113&permissions=277025392640&scope=bot).

### Commands

All commands use the Discord `/command` syntax. Additional parameters can be passed by tabbing through the different inputs.

#### Attack

Roll an attack and return the result.

__Options__

`add` - Add an attack to your character for later reference. Use `attackBonus`, `bonus`, `damage`, `modifier`, and `stat` to save details.

`advantage`/`disadvantage` - These options specify whether the attack should be rolled at advantage (roll two d20, take the highest) or disadvantage (roll two d20, take the lowest). If both are specified to be true, the default behavior is used (roll one d20).

`ac` - This option sets the armor class to determine a hit.

`edit` - Edit a saved attack with the matching name. Use `attackBonus`, `bonus`, `damage`, `modifier`, `name`, and `stat` to update details.

`list` - List the available attacks instead of attacking when set to True.

`modifier` - This option sets the modifier to the attack manually. This value should normally be the value between -4 and +4 that your character gets from the associated stat. Defaults to 0.

`multiple` - This option specifies how many time the attack should be attempted, useful for the DM when they need to make multiple monster checks simultaneously. Defaults to 1.

`name` - Use a saved attack by name. Options specified directly take precedence over the saved values.

`remove` - Remove a saved attack with the matching name.

`stat` - This option sets the stat associated with the attack. The available options are: Strength, Dexterity, Constitution, Intelligence, Wisdom, and Charisma.

#### Character

View or modify your character.

__Options__

`ancestry` - This option sets your active character's ancestry.

`alignment` - This option sets your active character's alignment. Options are C (Chaotic), N (Neutral), and L (Lawful).

`ac` - This option sets your active character's Armor Class (AC).

`background` - This option sets your active character's background.

`class` - This option sets your active character's class.

`deity` - This option sets your active character's deity.

`hp` - This option sets your active character's current Hit Points (HP). The minimum is 0, and any amount over the maximum will be lost.

`level` - This option sets your active character's level. The minimum is 0 and the maximum is 10.

`luck` - This option sets your active character's luck token.

`maxhp` - This option sets your active character's maximum Hit Points (HP). The minimum is 1.

`name` - This option sets your active character's name.

`title` - This option sets your active character's title.

`xp` - This option sets your active character's current XP. The minimum is 0.

`strength`/`dexterity`/`constitution`/`intelligence`/`wisdom`/`charisma` - These options set your character's stats. Valid range is 3-18.

#### Check

Roll a check and return the result. If your character has a luck token, you will be allowed to reroll.

__Options__

`advantage`/`disadvantage` - These options specify whether the check should be rolled at advantage (roll two d20, take the highest) or disadvantage (roll two d20, take the lowest). If both are specified to be true, the default behavior is used (roll one d20).

`dc` - This option sets the difficulty class of the check. The core rules suggest the following values: 9 (easy), 12 (hard), 15 (hard), or 18 (extreme).

`modifier` - This option sets the modifier to the roll manually. This value should normally be the value between -4 and +4 that your character gets from the associated stat. Defaults to 0.

`multiple` - This option specifies how many time the check should be attempted, useful for the DM when they need to make multiple monster checks simultaneously. Defaults to 1.

`stat` - This option sets the stat associated with the check. The available options are: Strength, Dexterity, Constitution, Intelligence, Wisdom, and Charisma.

#### Gear

Manage your character's gear.

__Options__

`add` - Add an item to your character's gear. Use `quantity` and `slots` to specify the quantity or number of slots for the item.

`edit` - Edit an item in your character's gear. Use `name`, `quantity` and `slots` to specify the changes you wish to make.

`remove` - Remove an item in your character's gear.

## HP

Manage your character's HP.

`amount` - This option specifies how much HP to add or subtract. It will not go above your character's maximum HP or below 0.

#### Light

Manage the light counter.

`reset` - This option resets the timer to 1h. Useful for when the team lights a new torch or casts the light spell.

`rounds` - This option counts down the timer by a number of rounds using the rule of 10 rounds per hour.

`minutes` - This option counts down the timer by a number of minutes for fine-grained handling.

#### Randomcharacter

Create a new character according to the quick rolling rules.

`level` - This option picks between a 0th-level (classless) character and a 1st-level character. Defaults to 0.

#### Roll

Roll dice and return the result. The only option is dice which is expected to be of the form `Term ((+/-) Term)...`.

e.g. `3d6`, `adv(d20) + 3`, `dis(1d4)`

__Terms__

`XdY` - roll a `Y`-sided die `X` times and add them together

`adv(...)` - roll the dice in parenthesis with advantage (roll two dice, take the highest)

`dis(...)` - roll the dice in parenthesis with disadvantage (roll two dice, take the lowest)

`(+/-)? Z` - add or subtract `Z`

#### Rollstats

Roll stats in order and return the result.
