DicePool
	=	sign:('+'/'-')? WS? d0:DiceExpr ds:( WS? ('+'/'-') WS? DiceExpr)* { return [{ first: true, neg: sign == '-', ...d0 }, ...ds.map(function (d) { return d[1] == "-" ? { neg: true, ...d[3] } : d[3] })]; }
    ;

DiceExpr
	=	num:NUM? WS? 'd'i WS? sides:NUM { return { num: num ? num : 1, sides: sides }; }
    /	'adv'i WS? '(' WS? d:DiceExpr ')' { return { adv: true, ...d }; }
    /	'dis'i WS? '(' WS? d:DiceExpr ')' { return { dis: true, ...d }; }
    /	sign:('+'/'-')? WS? num:NUM { return { value: (sign == '-' ? -1 : 1) * num }; }
    ;

NUM =	[0-9]+ { return parseInt(text()); }
WS	=	[ \t\r\n]+;