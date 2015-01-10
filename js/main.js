// JavaScript Document
/// <reference path="http://ajax.googleapis.com/ajax/libs/jquery/1/jquery.min.js" />
/// <reference path="numeric-1.2.6.min.js" />



var animateCount=0;
var speed=200;

$(document).ready(function () {

	// 二値化閾値スライダーの初期化
	$("#speedSlider").slider({
		min: 0, max: 1000, step: 10, value: 1000-speed,
		slide: function (event, ui) {
			speed=1000-ui.value;
			document.getElementById('speedSpan').innerHTML=speed;
		},
	});
	document.getElementById('speedSpan').innerHTML=speed;

	$("#start").click(function () {
		startAnimation();
	})

	startAnimation();

});


function startAnimation() {

	++animateCount;
	var animeteID=animateCount;

	var size=30;
	var elementSize=10;
	var P=identitySquareMatrix(size);
	var A=randomSymmetricMatrix(size);
	visualizeMatrix($("#Canvas-A"), A, size, size, -5, 5, elementSize);

	var rangeResultA;
	var R;
	var p=0;
	var q=1;
	var threshold=1e-2;
	var maxResult;
	var count=0;
	var maxIteration=30;

	function animate() {

		if(animeteID!=animateCount) {
			return;
		}

		document.getElementById('itrSpan').innerHTML=count;

		// search max |A[p][q]|
		maxResult=maxIdxInNonDiagonals(size, A);
		if(maxResult.value<threshold) {
			visualizeMatrix($("#Canvas-P"), P, size, size, -1, 1, elementSize);
			visualizeMatrix($("#Canvas-D"), A, size, size, -5, 5, elementSize);
			visualizeMatrix($("#Canvas-PT"), numeric.transpose(P), size, size, -1, 1, elementSize);
			return;
		}
		p=maxResult.row;
		q=maxResult.col;

		R=rotationMatrix_cggem(size, p, q, A);
		//R=rotationMatrix_prog(size, p, q, A);
		//R=rotationMatrix_kagishippo(size, p, q, A);

		// A <- R.transpose * A * R
		A=numeric.dot(numeric.transpose(R), A);
		A=numeric.dot(A, R);

		// P <- P * R
		P=numeric.dot(P, R);

		// visualization
		visualizeMatrix($("#Canvas-P"), P, size, size, -1, 1, elementSize);
		highlightMatrixCol($("#Canvas-P"), size, size, elementSize, p);
		highlightMatrixCol($("#Canvas-P"), size, size, elementSize, q);

		visualizeMatrix($("#Canvas-D"), A, size, size, -5, 5, elementSize);
		highlightMatrixRowCol($("#Canvas-D"), size, size, elementSize, p, q);
		highlightMatrixRowCol($("#Canvas-D"), size, size, elementSize, q, p);

		visualizeMatrix($("#Canvas-PT"), numeric.transpose(P), size, size, -1, 1, elementSize);
		highlightMatrixRow($("#Canvas-PT"), size, size, elementSize, p);
		highlightMatrixRow($("#Canvas-PT"), size, size, elementSize, q);

		++count;
		setTimeout(animate, speed);
	}
	animate();

}

function maxIdxInNonDiagonals(size, A) {
	var x=0;
	var y=1;
	var val=Math.abs(A[0][1]);
	for(var i=0; i<size-1; ++i) {
		for(var j=i+1; j<size; ++j) {
			if(val<Math.abs(A[i][j])) {
				x=i;
				y=j;
				val=Math.abs(A[i][j]);
			}
		}
	}
	return {row:x, col:y, value:val};
}

function rotationMatrix_cggem(size, p, q, A) {
	var th=0.5*Math.atan2(-2*A[p][q],A[p][p]-A[q][q]);
	var tmp=identitySquareMatrix(size);
	tmp[p][p]=Math.cos(th);
	tmp[p][q]=Math.sin(th);
	tmp[q][p]=-Math.sin(th);
	tmp[q][q]=Math.cos(th);
	return tmp;
}

function rotationMatrix_kagishippo(size, p, q, A) {
	var alpha=0.5*(A[p][p]-A[q][q]);
	var beta=-A[p][q];
	var gamma=Math.abs(alpha)/Math.sqrt(alpha*alpha+beta*beta);
	var costh=Math.sqrt(0.5*(1+gamma));
	var sinth=Math.sqrt(0.5*(1-gamma))*alpha*beta/Math.abs(alpha*beta);
	var tmp=identitySquareMatrix(size);
	tmp[p][p] = costh;
	tmp[p][q] = sinth;
	tmp[q][p] = -sinth;
	tmp[q][q] = costh;
	return tmp;
}



function rotationMatrix_prog(size, p, q, A) {
	var tan2th=2*A[p][q]/(A[p][p]-A[q][q]);
	var costh=Math.sqrt(0.5*(1+1/Math.sqrt(1+tan2th*tan2th)));
	var sinth=Math.sqrt(1-costh*costh)*tan2th/Math.abs(tan2th);
	var tmp=identitySquareMatrix(size);
	tmp[p][p]=costh;
	tmp[p][q]=-sinth;
	tmp[q][p]=sinth;
	tmp[q][q]=costh;
	return tmp;
}


function identitySquareMatrix(size) {
	var tmp=new Array(size);
	for(var i=0; i<size; ++i) {
		tmp[i]=new Array(size);
		for(var j=0; j<size; ++j) {
			if(i==j) {
				tmp[i][j]=1;
			} else {
				tmp[i][j]=0;
			}
		}
	}
	return tmp;
}

function randomSymmetricMatrix(size) {
	var tmp=numeric.random([size, size]);
	var val;
	for(var i=1; i<size; ++i) {
		for(var j=0; j<i; ++j) {
			tmp[i][j]=tmp[j][i];
		}
	}
	return tmp;
}


function visualizeMatrix(canvas, mat, rows, cols, min, max, elementSize) {
	var context = canvas.get(0).getContext("2d");
	canvas.attr("width", rows*elementSize);
	canvas.attr("height", cols*elementSize);
	var canvasWidth = canvas.width();
	var canvasHeight = canvas.height();

	context.setTransform(1,0,0,1,0,0);
	context.clearRect(0, 0, canvasWidth, canvasHeight);

	var imgData = context.getImageData(0,0,canvasWidth,canvasHeight);	
	var intensity;
	var r,g,b,a;
	var idx,x,y;
	for(var i = 0; i < rows; ++i) {
		for(var j = 0; j < cols; ++j) {
			if(mat[i][j] >= max) {
				intensity = 1;
			} else if(mat[i][j] <= min) {
				intensity = 0;
			} else {
				intensity = (mat[i][j] - min)/(max - min);
			}
			// グレースケール
			/*
			intensity = Math.floor(255*intensity);
			intensity=255-intensity;
			r=intensity;
			g=intensity;
			b=intensity;
			a=255;
			*/
			// カラー(赤・青)
			if(intensity<0.5) {
				r=0;
				g=0;
				b=255;
				a=-2*intensity+1;
			} else {
				r=255;
				g=0;
				b=0
				a=2*intensity-1;
			}
			r=Math.floor(255*r);
			g=Math.floor(255*g);
			b=Math.floor(255*b);
			a=Math.floor(255*a);

			for(var k=0; k<elementSize; ++k) {
				for(var l = 0; l < elementSize; ++l) {
					x = Math.floor(elementSize * j + k);
					y = Math.floor(elementSize * i + l);
					idx = imgData.width*y+x;
					imgData.data[4*idx] = r;
					imgData.data[4*idx+1] = g;
					imgData.data[4*idx+2] = b;
					imgData.data[4*idx+3] = a;
				}
			}
		}
	}
	context.putImageData(imgData, 0, 0);
}


function highlightMatrixRowCol(canvas, rows, cols, elementSize, row, col) {
	var context=canvas.get(0).getContext("2d");
	var canvasWidth=canvas.width();
	var canvasHeight=canvas.height();
	context.setTransform(1, 0, 0, 1, 0, 0);

	context.fillStyle='#00ff00';
	context.globalAlpha=0.1;
	context.beginPath();
	context.rect(0, elementSize*row, canvasWidth, elementSize);
	context.rect(elementSize*col, 0, elementSize, canvasHeight);
	context.fill();
	context.globalAlpha=1.0;
}

function highlightMatrixRow(canvas, rows, cols, elementSize, row) {
	var context=canvas.get(0).getContext("2d");
	var canvasWidth=canvas.width();
	var canvasHeight=canvas.height();
	context.setTransform(1, 0, 0, 1, 0, 0);

	context.fillStyle='#00ff00';
	context.globalAlpha=0.2;
	context.beginPath();
	context.rect(0, elementSize*row, canvasWidth, elementSize);
	context.fill();
	context.globalAlpha=1.0;
}

function highlightMatrixCol(canvas, rows, cols, elementSize, col) {
	var context=canvas.get(0).getContext("2d");
	var canvasWidth=canvas.width();
	var canvasHeight=canvas.height();
	context.setTransform(1, 0, 0, 1, 0, 0);

	context.fillStyle='#00ff00';
	context.globalAlpha=0.2;
	context.beginPath();
	context.rect(elementSize*col, 0, elementSize, canvasHeight);
	context.fill();
	context.globalAlpha=1.0;
}

