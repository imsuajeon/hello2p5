let video;
let handpose;
let hands = [];

let lines = [];
let prev = null;
let fallingMessages = [];
let hearts = ["🩷", "❤", "🧡", "💛", "💜", "💙", "🩵", "💚", "🖤", "🩶", "🤍", "🤎"];

function setup() {
  createCanvas(640, 480);

  // 웹캠 캡처
  video = createCapture(VIDEO);
  video.size(width, height);
  video.hide();

  // ml5 handpose 모델 초기화
  handpose = ml5.handpose(video, modelReady);
  handpose.on("predict", results => {
    hands = results;
  });

  noFill();
}

function modelReady() {
  console.log("Handpose Model Loaded!");
}

function draw() {
  // 영상과 선은 거울모드 적용 (좌우 반전)
  push();
  translate(width, 0);
  scale(-1, 1);
  image(video, 0, 0, width, height);

  if (hands.length > 0) {
    let hand = hands[0];
    if (hand.landmarks && hand.landmarks.length === 21) {
      // 각 손가락의 상태 (tip이 해당 관절보다 위쪽이면 펼쳐진 것으로 판단)
      let thumbRaised  = hand.landmarks[4][1]  < hand.landmarks[3][1];
      let indexRaised  = hand.landmarks[8][1]  < hand.landmarks[6][1];
      let middleRaised = hand.landmarks[12][1] < hand.landmarks[10][1];
      let ringRaised   = hand.landmarks[16][1] < hand.landmarks[14][1];
      let pinkyRaised  = hand.landmarks[20][1] < hand.landmarks[18][1];

      // 손가락 다 펼치면 (엄지 포함) 그렸던 선 모두 지움
      let fullyOpen = thumbRaised && indexRaised && !middleRaised && !ringRaised && pinkyRaised;
      if (fullyOpen) {
        lines = [];
        prev = null;
      }
      // 검지, 중지, 약지, 새끼 모두 펼치면 → 하트 이모티콘 떨어짐
      else if (!thumbRaised&&indexRaised && middleRaised && ringRaised && pinkyRaised) {
        fallingMessages.push({
          text: random(hearts),
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
      // 검지, 중지, 약지 펼치고, 새끼 굽힘 → thumbup 이모티콘 떨어짐
      else if (indexRaised && middleRaised && ringRaised && !pinkyRaised) {
        fallingMessages.push({
          text: "👍",
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
      // 검지와 중지 펼치고, 약지와 새끼 굽힘 → "야호" 텍스트 떨어짐
      else if (indexRaised && middleRaised && !ringRaised && !pinkyRaised) {
        fallingMessages.push({
          text: "야호",
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
      // 오직 새끼만 펼치면 → "202100322" 떨어짐  
      else if (pinkyRaised && !indexRaised && !middleRaised && !ringRaised) {
        fallingMessages.push({
          text: "202100322",
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
      // 그 외에는 기본적으로 검지 손가락 tip을 따라 선 그리기
      else {
        let ix = hand.landmarks[8][0];
        let iy = hand.landmarks[8][1];
        if (prev) {
          lines.push({
            x1: prev.x,
            y1: prev.y,
            x2: ix,
            y2: iy,
            r: int(random(255)),
            g: int(random(255)),
            b: int(random(255))
          });
        }
        prev = { x: ix, y: iy };
      }
    }
  } else {
    prev = null;
  }

  // 그려진 선들을 출력
  strokeWeight(3);
  for (let seg of lines) {
    stroke(seg.r, seg.g, seg.b, 200);
    line(seg.x1, seg.y1, seg.x2, seg.y2);
  }
  pop();

  // fallingMessages (떨어지는 텍스트)는 거울모드 해제된 좌표계에서 그려져, 텍스트가 뒤집히지 않음
  for (let i = fallingMessages.length - 1; i >= 0; i--) {
    fallingMessages[i].y += fallingMessages[i].speed;
    fill(fallingMessages[i].color.r, fallingMessages[i].color.g, fallingMessages[i].color.b);
    noStroke();
    textSize(32);
    text(fallingMessages[i].text, fallingMessages[i].x, fallingMessages[i].y);
    if (fallingMessages[i].y > height) {
      fallingMessages.splice(i, 1);
    }
  }
}
