const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const channelRoutes = require('./routes/channel');

const app = express();

// 환경변수 확인
const PORT = process.env.PORT || 4001;
console.log('환경변수 PORT:', process.env.PORT);
console.log('환경변수 파일 경로:', path.join(__dirname, '..', '.env'));

// 미들웨어 설정
app.use(cors());
app.use(express.json());

// MongoDB 연결 (선택적)
if (process.env.MONGODB_URI) {
  mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB 연결 성공'))
  .catch((err) => {
    console.error('MongoDB 연결 실패:', err);
    console.log('MongoDB 없이 서버를 실행합니다.');
  });
} else {
  console.log('MongoDB URI가 설정되지 않았습니다. MongoDB 없이 서버를 실행합니다.');
}

// 라우트 설정
app.use('/api/channel', channelRoutes);

// 헬스체크
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// 서버 시작
app.listen(PORT, () => {
  console.log(`서버가 포트 ${PORT}에서 실행 중입니다.`);
}); 