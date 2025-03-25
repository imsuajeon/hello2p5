// 전역 변수 선언
let video;              // 웹캠 비디오 스트림을 저장할 변수
let handpose;           // ml5 handpose 모델 객체를 저장할 변수
let hands = [];         // 손 인식 결과(손 예측 데이터)를 저장할 배열

let lines = [];         // 그려진 선분들을 저장하는 배열 (각 선분은 시작점과 끝점, 색상을 가짐)
let prev = null;        // 이전 프레임에서의 검지 손가락 좌표를 저장 (연속된 선을 그리기 위해 사용)
let fallingMessages = []; // 화면 위에서 아래로 떨어지는 메시지들을 저장하는 배열
let hearts = ["🩷", "❤", "🧡", "💛", "💜", "💙", "🩵", "💚", "🖤", "🩶", "🤍", "🤎"]; // 하트 이모티콘 목록

function setup() {
  createCanvas(640, 480);   // 640x480 픽셀의 캔버스 생성

  // 웹캠 캡처 설정
  video = createCapture(VIDEO);  // 비디오 캡처 시작
  video.size(width, height);       // 비디오 크기를 캔버스 크기와 동일하게 설정
  video.hide();                    // 비디오 엘리먼트를 숨김 (캔버스에만 출력하기 위해)

  // ml5 handpose 모델 초기화 및 로드
  handpose = ml5.handpose(video, modelReady);
  // 손 인식 모델이 예측 결과를 낼 때마다 hands 배열을 업데이트함
  handpose.on("predict", results => {
    hands = results;
  });

  noFill(); // 도형 내부를 채우지 않도록 설정 (선만 그리기 위함)
}

function modelReady() {
  // 모델이 성공적으로 로드되면 콘솔에 메시지 출력
  console.log("Handpose Model Loaded!");
}

function draw() {
  // 거울 모드 적용을 위한 좌표 변환
  push();                     // 현재의 드로잉 상태 저장
  translate(width, 0);        // 캔버스의 오른쪽 끝으로 좌표 이동
  scale(-1, 1);               // x축을 반전시켜 거울 효과 적용
  image(video, 0, 0, width, height);  // 비디오 이미지를 캔버스에 출력

  // 손 인식 결과가 존재하는지 확인
  if (hands.length > 0) {
    let hand = hands[0]; // 첫 번째 인식된 손 데이터를 사용
    // 손 인식 데이터가 유효하며, 21개의 랜드마크(손가락 관절 좌표)가 있는지 확인
    if (hand.landmarks && hand.landmarks.length === 21) {
      // 각 손가락 tip(끝부분)과 그 아래 관절의 y 좌표를 비교하여 손가락이 펼쳐졌는지 판단
      // y 좌표가 작을수록 위쪽에 위치하므로, tip의 y 값이 관절보다 작으면 손가락이 '펼쳐짐'
      let thumbRaised  = hand.landmarks[4][1]  < hand.landmarks[3][1];   // 엄지
      let indexRaised  = hand.landmarks[8][1]  < hand.landmarks[6][1];   // 검지
      let middleRaised = hand.landmarks[12][1] < hand.landmarks[10][1];  // 중지
      let ringRaised   = hand.landmarks[16][1] < hand.landmarks[14][1];  // 약지
      let pinkyRaised  = hand.landmarks[20][1] < hand.landmarks[18][1];  // 새끼

      // 특정 제스처 인식을 위한 조건 검사

      // 1. 'thumbindexpinky' 제스처: 엄지와 검지, 새끼가 펼쳐지고, 중지와 약지는 굽혀진 상태
      //    (이 조건에 해당하면 그렸던 선들을 모두 지우고 이전 좌표를 초기화)
      let thumbindexpinky = thumbRaised && indexRaised && !middleRaised && !ringRaised && pinkyRaised;
      if (thumbindexpinky) {
        lines = [];   // 그려진 선 목록 초기화
        prev = null;  // 이전 좌표 초기화
      }
      // 2. 하트 이모티콘 떨어짐: 엄지는 굽혀지고, 검지, 중지, 약지, 새끼는 모두 펼쳐진 상태
      else if (!thumbRaised && indexRaised && middleRaised && ringRaised && pinkyRaised) {
        fallingMessages.push({
          text: random(hearts),    // 랜덤으로 하트 이모티콘 선택
          x: random(width),         // x 좌표를 캔버스 내 임의 위치로 설정
          y: 0,                     // y 좌표는 화면 상단에서 시작
          speed: random(2, 5),      // 떨어지는 속도는 2에서 5 사이의 랜덤 값
          color: {                  // 메시지 텍스트의 색상을 랜덤 RGB 값으로 설정
            r: int(random(255)),
            g: int(random(255)),
            b: int(random(255))
          }
        });
      }
      // 3. 검지, 중지, 약지가 펼쳐지고, 새끼가 굽혀진 경우 → "thumbup" 이모티콘(👍) 떨어짐
      else if (indexRaised && middleRaised && ringRaised && !pinkyRaised) {
        fallingMessages.push({
          text: "👍",              // 고정된 thumbup 이모티콘 사용
          x: random(width),
          y: 0,
          speed: random(2, 5),
          color: {
            r: int(random(255)),
            g: int(random(255)),
            b: int(random(255))
          }
        });
      }
      // 4. 검지와 중지가 펼쳐지고, 약지와 새끼가 굽혀진 경우 → "야호" 텍스트 떨어짐
      else if (indexRaised && middleRaised && !ringRaised && !pinkyRaised) {
        fallingMessages.push({
          text: "야호",            // 고정된 텍스트 메시지
          x: random(width),
          y: 0,
          speed: random(2, 5),
          color: {
            r: int(random(255)),
            g: int(random(255)),
            b: int(random(255))
          }
        });
      }
      // 5. 오직 새끼만 펼쳐진 경우 → "202100322" 텍스트 떨어짐
      else if (pinkyRaised && !indexRaised && !middleRaised && !ringRaised) {
        fallingMessages.push({
          text: "202100322",       // 고정된 텍스트 메시지
          x: random(width),
          y: 0,
          speed: random(2, 5),
          color: {
            r: int(random(255)),
            g: int(random(255)),
            b: int(random(255))
          }
        });
      }
      // 6. 엄지만 올린 경우: thumb만 올리고, 다른 손가락은 내려간 상태
      else if (thumbRaised && !indexRaised && !middleRaised && !ringRaised && !pinkyRaised) {
        let thumbX = hand.landmarks[4][0];
        let thumbY = hand.landmarks[4][1];
        let threshold = 20;  // 삭제할 반경 (픽셀 단위)
        lines = lines.filter(seg => {
          let d1 = dist(seg.x1, seg.y1, thumbX, thumbY);
          let d2 = dist(seg.x2, seg.y2, thumbX, thumbY);
          return (d1 > threshold && d2 > threshold);
        });
      }
      // 7. 위의 조건에 해당하지 않을 경우: 기본적으로 검지 손가락의 tip을 따라 선 그리기
      else {
        let ix = hand.landmarks[8][0]; // 검지 손가락 tip의 x 좌표
        let iy = hand.landmarks[8][1]; // 검지 손가락 tip의 y 좌표
        // 이전 좌표가 존재하면 이전 좌표와 현재 좌표를 잇는 선을 생성하여 lines 배열에 추가
        if (prev) {
          lines.push({
            x1: prev.x,             // 선의 시작점 x 좌표
            y1: prev.y,             // 선의 시작점 y 좌표
            x2: ix,                 // 선의 끝점 x 좌표
            y2: iy,                 // 선의 끝점 y 좌표
            r: int(random(255)),    // 선의 색상 R 값 (랜덤)
            g: int(random(255)),    // 선의 색상 G 값 (랜덤)
            b: int(random(255))     // 선의 색상 B 값 (랜덤)
          });
        }
        // 현재 검지 손가락 좌표를 이전 좌표로 저장 (다음 프레임에서 선을 이어 그리기 위함)
        prev = { x: ix, y: iy };
      }
    }
  } else {
    // 손이 인식되지 않으면 이전 좌표 초기화 (연결되지 않은 선 방지)
    prev = null;
  }

  // 거울 모드 상태 내에서 그려진 선들을 출력
  strokeWeight(3); // 선의 두께 설정
  for (let seg of lines) {
    // 선의 색상과 투명도를 설정한 후 선을 그림
    stroke(seg.r, seg.g, seg.b, 200);
    line(seg.x1, seg.y1, seg.x2, seg.y2);
  }
  pop(); // 좌표 변환 상태 복원

  // 화면 좌표계(거울 모드 해제된 상태)에서 fallingMessages (떨어지는 텍스트) 출력
  for (let i = fallingMessages.length - 1; i >= 0; i--) {
    fallingMessages[i].y += fallingMessages[i].speed; // 메시지를 아래로 떨어뜨리기 위해 y 좌표 증가
    // 메시지 색상 설정
    fill(fallingMessages[i].color.r, fallingMessages[i].color.g, fallingMessages[i].color.b);
    noStroke();
    textSize(32); // 텍스트 크기 설정
    text(fallingMessages[i].text, fallingMessages[i].x, fallingMessages[i].y); // 텍스트 출력
    // 메시지가 화면 하단을 벗어나면 배열에서 제거
    if (fallingMessages[i].y > height) {
      fallingMessages.splice(i, 1);
    }
  }
}
