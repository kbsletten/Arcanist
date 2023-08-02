# Arcanist [![Node.js CI](https://github.com/kbsletten/Arcanist/actions/workflows/node.js.yml/badge.svg)](https://github.com/kbsletten/Arcanist/actions/workflows/node.js.yml)

A Discord bot for the [Shadowdark RPG](https://www.thearcanelibrary.com/pages/shadowdark).

## How to Use

To add Arcanist to your discord server, [click here](https://discord.com/api/oauth2/authorize?client_id=1121532418738901113&permissions=277025392640&scope=bot).

### Commands

All commands use the Discord `/command` syntax. Additional parameters can be passed by tabbing through the different inputs.

#### Character

View or modify your character.

__Options__

`name` - This option sets your active character's name.

`strength`/`dexterity`/`constitution`/`intelligence`/`wisdom`/`charisma` - These options set your character's stats. Valid range is 3-18.

#### Check

Roll a check and return the result.

__Options__

`advantage`/`disadvantage` - These options specify whether the check should be rolled at advantage (roll two d20, take the highest) or disadvantage (roll two d20, take the lowest). If both are specified to be true, the default behavior is used (roll one d20).

`dc` - This option sets the difficulty class of the check. The core rules suggest the following values: 9 (easy), 12 (hard), 15 (hard), or 18 (extreme).

`modifier` - This option sets the modifier to the roll manually. This value should normally be the value between -4 and +4 that your character gets from the associated stat. Defaults to 0.

`multiple` - This option specifies how many time the check should be attempted, useful for the DM when they need to make multiple monster checks simultaneously. Defaults to 1.

`stat` - This option sets the stat associated with the check. The available options are: Strength, Dexterity, Constitution, Intelligence, Wisdom, and Charisma.

#### Light

Manage the light counter.

`reset` - This option resets the timer to 1h. Useful for when the team lights a new torch or casts the light spell.

`rounds` - This option counts down the timer by a number of rounds using the rule of 10 rounds per hour.

`minutes` - This option counts down the timer by a number of minutes for fine-grained handling.

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
