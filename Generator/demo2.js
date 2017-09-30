function* gen(x){
  try {
    var y = yield x + 2;
  } catch (e){
    console.log(e);
  }
  return y;
}

var g = gen(1);
g.next();
g.throw('出错了');  //出错了


function* gen2(x){
	var a = yield x
	console.log(a)
	return a
}

var g2 = gen2(3)
console.log(g2.next())  //{ value: 3, done: false }
console.log(g2.next())  //{ value: undefined, done: true }