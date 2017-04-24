const MCD_TIMES = 3; //アラート鳴らすときのマクドナルドの数



function calcWeight() {
  //  var weight = document.getElementById('id01').value; // idが「id01」のテキストボックスに入力された値を取得して変数weightに代入
  //  weight = Number(weight); // 入力された文字列を数値に変換する
  // BMIを計算 // 結果を表示

  if (document.getElementById("1").checked) {
    var weight = 1
  }
  if (document.getElementById("2").checked) {
    var weight = 2
  }
  if (document.getElementById("3").checked) {
    var weight = 3
  }
  if (document.getElementById("4").checked){
    var weight = 4
  }


  // 距離を計算する関数．
  function calcDistance(lat1, lat2, lon1, lon2) {
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

  function calcSpeed(km, sec) {
    return km * 1000 / sec;
  }

  function calcInterval(t1, t2) {
    // 時間を1970年1月1日0時0分0秒からのミリ秒数に変換
    var et1 = Date.parse(t1);
    var et2 = Date.parse(t2);

    // 結果を秒で返す
    return Math.abs(et1 - et2) / 1000;
  }

  // ドキュメントが読み込まれたら次の処理を実行．
  $(function() {

    // xmlファイルのパス
    var urls = ["./wasuremono1.xml", "wasuremono2.xml", "./mcd1.xml", "./mcd2.xml", "./hikikomori1.xml", "./hikikomori2.xml", "./hongo1.xml", "./hongo2.xml"]

    // 重心の位置を求めるために使う変数
    var sum_lats = 0; // 数値は初期値にゼロを設定しないと加算時にNaN．
    var sum_lons = 0;

    // 経度，緯度を格納する配列
    var latlngArray1 = [];
    var latlngArray2 = [];

    // 時間を格納する配列の準備
    var timeArray = [];

    var timepassed = new Array();
    timepassed[0] = 0;

    // xmlファイルの読み込み(鍵)．Markerが上書きされないように外に出し，Ajaxはxmlの読み込みのためだけに使うのがポイントだった．
    $.ajax({
      url: urls[2 * weight - 2],
      type: "GET",
      dataType: 'xml',
      timeout: 1000,
      async: false, // 非同期オプションを無効にして同期リクエストを行い，Ajaxで読み込んだ値のスコープをグローバルに．
      error: function() {
        alert("ロード失敗1")
      },
      success: function(res) { //resに全ての情報が埋め込まれている．responseの略．
        // trkptタグを抽出して配列に埋め込む
        var time = res.getElementsByTagName("time");
        for (var i = 0; i < time.length; i++) {
          timeArray[i] = time[i].innerHTML
        }

        for (var i = 1; i < time.length; i++) {
          timepassed[i] = calcInterval(timeArray[i - 1], timeArray[i]);
          console.log("timepassed" + i + "=" + timepassed[i]);
        }

        var trksegArray = res.getElementsByTagName("trkpt"); // Elements! sがないと，not Functionエラー，
        for (var i = 0; i < trksegArray.length; i++) {
          var lat = parseFloat(trksegArray[i].getAttribute("lat")); // parseFloatをつけないと文字列連結．typeof()で確認．
          var lon = parseFloat(trksegArray[i].getAttribute("lon"));
          latlngArray1[i] = [lat, lon];
          sum_lats += lat;
          sum_lons += lon;
        }
      }
    });


    // xmlファイルの読み込み(財布)
    $.ajax({
      url: urls[2 * weight - 1],
      type: "GET",
      dataType: 'xml',
      timeout: 1000,
      async: false,
      error: function() {
        alert("ロード失敗2");
      },
      success: function(res) {
        var trksegArray = res.getElementsByTagName("trkpt");
        for (var i = 0; i < trksegArray.length; i++) {
          var lat = parseFloat(trksegArray[i].getAttribute("lat"));
          var lon = parseFloat(trksegArray[i].getAttribute("lon"));
          latlngArray2[i] = [lat, lon];
          sum_lats += lat;
          sum_lons += lon;
        }
      }
    });


    // 異常の計測

    var abnormal = false;
    // 重心の計算
    var data_number = latlngArray1.length + latlngArray2.length;
    var lats_center = sum_lats / data_number;
    var lons_center = sum_lons / data_number;
    var latlng_center = new google.maps.LatLng(lats_center, lons_center);

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
    for (var i = 0; i < latlngArray1.length; i++) {

      var lat1 = latlngArray1[i][0];
      var lon1 = latlngArray1[i][1];
      var latlng1 = new google.maps.LatLng(lat1, lon1);

      var lat2 = latlngArray2[i][0];
      var lon2 = latlngArray2[i][1];
      var latlng2 = new google.maps.LatLng(lat2, lon2);

      var distance = calcDistance(lat1, lat2, lon1, lon2);

      if (i == latlngArray1.length - 1) { //最新情報
        if (distance > 0.05) {
          alert("忘れ物をしています");
          abnormal = true;
          var marker1 = new google.maps.Marker({
            map: map,
            position: latlng1,
            icon: "https://maps.google.com/mapfiles/ms/icons/blue-dot.png",
            zetIndex: 0
          });
          var marker2 = new google.maps.Marker({
            map: map,
            position: latlng2,
            icon: "https://maps.google.com/mapfiles/ms/icons/red-dot.png",
            zetIndex: 10
          });
        }
      } else {　 //それ以外の情報
        if (distance > 0.05) {
          polylineArray1.push(latlng1);
          polylineArray2.push(latlng2);
        }
      }
    }

    // Polylineオブジェクト(鍵)
    var line = new google.maps.Polyline({
      path: polylineArray1, //ポリラインの配列
      strokeColor: '#1E90FF', //色（#RRGGBB形式）
      strokeOpacity: 1.0, //透明度
      strokeWeight: 8 //太さ
    });
    line.setMap(map);

    // Polylineオブジェクト(財布)
    var line = new google.maps.Polyline({
      path: polylineArray2,
      strokeColor: '#FF0000',
      strokeOpacity: 1.0,
      strokeWeight: 8
    });
    line.setMap(map);

    // ここから茶屋分

    //各点間の時間と速度を格納する配列を準備する
    var intervalArray = new Array(); // 移動時間を格納する配列
    var speedArray = new Array(); // 速度を格納する配列
    speedArray[0] = 0; // 速度の初期値を代入

    // マクドナルドの位置登録
    var mcd_okachimachi = [35.708180, 139.773754];
    var mcd_suehirocho = [35.703837, 139.772071];
    var mcd_akihabara = [35.699774, 139.771846];
    var mcd = [mcd_okachimachi, mcd_suehirocho, mcd_akihabara];

    // 変数設定
    var timecounter = 0;　 //20秒数える
    var stop = true;　 //20病超えたらカウント中止
    var mappoint = []; //停止点の配列

    // 停留点探索
    for (var i = 0, j = 0; i < latlngArray1.length - 1; i++) {
      intervalArray[i] = calcInterval(timeArray[i], timeArray[i + 1]);
      var distance = calcDistance(latlngArray1[i][0], latlngArray1[i + 1][0], latlngArray1[i][1], latlngArray1[i + 1][1]);
      speedArray[i + 1] = calcSpeed(distance, intervalArray[i]);

      if (speedArray[i] < 1.7) {
        timecounter += intervalArray[i];
      } else {
        timecounter = 0
        stop = true
      }

      if ((timecounter > 20) && (stop == true)) {

        mappoint[j] = latlngArray1[i];
        j++;
        stop = false

      }


    }

    var count_mcd_times = 0;
    for (var i = 0; i < mappoint.length; i++) {
      for (var j = 0; j < mcd.length; j++) {
        if (calcDistance(mcd[j][0], mappoint[i][0], mcd[j][1], mappoint[i][1]) < 0.05) {
          count_mcd_times++;
          console.log(mappoint[i]);
          var latlng = new google.maps.LatLng(mappoint[i][0], mappoint[i][1]);
          var marker = new google.maps.Marker({
            map: map,
            position: latlng,
            icon: "https://maps.google.com/mapfiles/ms/icons/red-dot.png",
            zetIndex: 10
          });
        }
      }

    }
    if (count_mcd_times >= MCD_TIMES) {
      alert("マクドナルド3回目です");
      abnormal = true;
    }


    //hirokawa

    var kyori = [];
    var ieiru;
    ieiru = 1;
    var sotoiru;
    sotoiru = 1;
    //マーカー作成
    for (var i = 0; i < latlngArray1.length; i++) {
      var lat1 = latlngArray1[i][0];
      var lon1 = latlngArray1[i][1];
      var lat2 = latlngArray2[i][0];
      var lon2 = latlngArray2[i][1];


      kyori[i] = calcDistance(lat1, 35.710287, lon1, 139.758753);
      console.log("kyori[" + i + "]=" + kyori[i]);

      if (kyori[i] < 0.03) {
        ieiru += timepassed[i];
        sotoiru = 0;
      } else {
        sotoiru += timepassed[i];
        ieiru = 0;
      }


      console.log("ieiru=" + ieiru);
      console.log("sotoiru=" + sotoiru);





      if (ieiru > 30 * 3600) {
        var latlng = new google.maps.LatLng(lat1, lon1);
        var marker = new google.maps.Marker({
          map: map,
          position: latlng,
          icon: "https://maps.google.com/mapfiles/ms/icons/red-dot.png",
          zetIndex: 10

        });
        alert('引きこもり');
        ieiru=0;
        
      } else if (sotoiru > 30 * 3600) {
        var latlng = new google.maps.LatLng(lat1, lon1);
        var marker = new google.maps.Marker({
          map: map,
          position: latlng,
          icon: "https://maps.google.com/mapfiles/ms/icons/blue-dot.png",
          zetIndex: 11
        });
        alert('長時間外出');
        abnormal = true;
        sotoiru = 0;
      } else;
    }

    if (!abnormal){
      alert("異常なし");
    }
  });
}