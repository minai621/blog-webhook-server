# 로그 파일 경로 설정
LOG_FILE="~/dev/blog-webhook-server/webhook.log"

# 현재 시간을 로그에 기록
echo "$(date): 웹훅 서버 재시작 스크립트 실행" >> $LOG_FILE

# 3100번 포트를 사용 중인 프로세스 종료
PID=$(lsof -t -i:3100)
if [ ! -z "$PID" ]; then
    echo "$(date): 포트 3100을 사용 중인 프로세스(PID: $PID) 종료" >> $LOG_FILE
    kill $PID
    sleep 2  # 프로세스가 완전히 종료되기를 기다림
fi

# 웹훅 서버 시작
echo "$(date): 웹훅 서버 시작" >> $LOG_FILE
nohup node ~/dev/blog-webhook-server/src/server.js >> $LOG_FILE 2>&1 &

# 새로 시작된 프로세스의 PID 확인 및 기록
NEW_PID=$!
echo "$(date): 새로운 웹훅 서버 프로세스 시작됨 (PID: $NEW_PID)" >> $LOG_FILE

echo "웹훅 서버가 재시작되었습니다. 로그 확인: $LOG_FILE"