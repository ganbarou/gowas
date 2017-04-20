// git test

// 距離を計算する関数．
function calcDistance(lat1,lat2,lon1,lon2) {
	var r = 6378.137; // 地球の半径

	// 緯度差と経度差をラジアンに変換
	var latRad = Math.abs(lat1 - lat2) * Math.PI / 180;
	var lngRad = Math.abs(lon1 - lon2) * Math.PI / 180;

	// 南北と東西の距離を計算
	var distNs = r * latRad;
	var distEw = r * lngRad * Math.cos(lat1 * Math.PI / 180);

	// 2点間の距離を求めてKmで返す
	return Math.sqrt(Math.pow(distNs, 2) + Math.pow(distEw, 2));
}


// ドキュメントが読み込まれたら次の処理を実行．
$(function() {

	// xmlファイルのパス
	var urls = ["./data1.xml","./data2.xml"]

	// 重心の位置を求めるために使う変数
	var sum_lats = 0; // 数値は初期値にゼロを設定しないと加算時にNaN．
	var sum_lons = 0;

	// 経度，緯度を格納する配列
	var latlngArray1 = [];
	var latlngArray2 = [];

	// xmlファイルの読み込み(鍵)．Markerが上書きされないように外に出し，Ajaxはxmlの読み込みのためだけに使うのがポイントだった．
	$.ajax({
		url: urls[0],
		type: "GET",
		dataType:'xml',
		timeout:1000,
		async: false, // 非同期オプションを無効にして同期リクエストを行い，Ajaxで読み込んだ値のスコープをグローバルに．
		error:function(){
			alert("ロード失敗1")
		},
		success: function(res) { //resに全ての情報が埋め込まれている．responseの略．
		  // trkptタグを抽出して配列に埋め込む
 			var trksegArray = res.getElementsByTagName("trkpt"); // Elements! sがないと，not Functionエラー，
			for(var i = 0; i < trksegArray.length; i++){
				var lat = parseFloat(trksegArray[i].getAttribute("lat"));// parseFloatをつけないと文字列連結．typeof()で確認．
				var lon = parseFloat(trksegArray[i].getAttribute("lon"));
				latlngArray1[i] = [lat,lon];
				sum_lats += lat;
				sum_lons += lon;
			}
	 	}
	});

	// xmlファイルの読み込み(財布)
	$.ajax({
		url: urls[1],
		type: "GET",
		dataType:'xml',
		timeout:1000,
		async: false,
		error:function(){
            alert("ロード失敗2");
        },
		success: function(res) {
 			var trksegArray = res.getElementsByTagName("trkpt");
			for(var i = 0; i < trksegArray.length; i++){
				var lat = parseFloat(trksegArray[i].getAttribute("lat"));
				var lon = parseFloat(trksegArray[i].getAttribute("lon"));
				latlngArray2[i] = [lat,lon];
				sum_lats += lat;
				sum_lons += lon;
			}
	 	}
	});

	// 重心の計算
	var data_number = latlngArray1.length + latlngArray2.length;
	var lats_center = sum_lats/data_number;
	var lons_center = sum_lons/data_number;
	var latlng_center = new google.maps.LatLng(lats_center,lons_center);

	// Googleマップのオプション．
	var mapOptions = {
		zoom: 14,
		center: latlng_center,
		mapTypeId: google.maps.MapTypeId.ROADMAP
	};

	// Googleマップオブジェクト．
	var map = new google.maps.Map(document.getElementById('map'), mapOptions);

	// ポリラインを表示するためのデータを格納する配列．
	var polylineArray1 = [];
	var polylineArray2 = [];

	//マーカー及びポリライン配列の作成．
	for(var i = 0; i < latlngArray1.length; i++){

		var lat1 = latlngArray1[i][0];
		var lon1 = latlngArray1[i][1];
		var latlng1 = new google.maps.LatLng(lat1, lon1);

		var lat2 = latlngArray2[i][0];
		var lon2 = latlngArray2[i][1];
		var latlng2 = new google.maps.LatLng(lat2, lon2);

		var distance = calcDistance(lat1,lat2,lon1,lon2);

		if(i == latlngArray1.length-1){ //最新情報
			if(distance > 0.05){
				var marker1 = new google.maps.Marker({map: map, position: latlng1, icon:"https://maps.google.com/mapfiles/ms/icons/blue-dot.png",zetIndex:0});
				var marker2 = new google.maps.Marker({map: map, position: latlng2, icon:"https://maps.google.com/mapfiles/ms/icons/red-dot.png",zetIndex:10});
			}
		}else{　//それ以外の情報
			if(distance > 0.05){
				polylineArray1.push(latlng1);
				polylineArray2.push(latlng2);
			}
		}
	}

	// Polylineオブジェクト(鍵)
	var line = new google.maps.Polyline({
	 path: polylineArray1 , //ポリラインの配列
	 strokeColor: '#1E90FF', //色（#RRGGBB形式）
	 strokeOpacity: 1.0, //透明度
	 strokeWeight: 8 //太さ
	});
	line.setMap(map);

	// Polylineオブジェクト(財布)
	var line = new google.maps.Polyline({
	 path: polylineArray2 ,
	 strokeColor: '#FF0000',
	 strokeOpacity: 1.0,
	 strokeWeight: 8
	});
	line.setMap(map);

});
