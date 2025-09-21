
const WebSocket = require('ws');
const uuid = require('uuid').v4;

module.exports = {
    // 插件名字
    name: "esp-ai-plugin-aliyun-cosyvoice",
    // 插件类型 LLM | TTS | IAT
    type: "TTS",
    async main({ text, tts_config, cb, log, ttsServerErrorCb, connectServerCb, connectServerBeforeCb, logWSServer, session_id }) {
        try {
            const { api_key, voice_id } = tts_config;
            if (!voice_id) return log.error(`请配给 TTS 配置 voice_id 参数。`)

            // WebSocket服务器地址
            const url = 'wss://dashscope.aliyuncs.com/api-ws/v1/inference/';
            const taskId = uuid();
            let shouldClose = false;
            let taskStarted = false;
            let taskFinished = false;
            // 发送run-task指令
            const runTaskMessage = JSON.stringify({
                header: {
                    action: 'run-task',
                    task_id: taskId,
                    streaming: 'duplex'
                },
                payload: {
                    task_group: 'audio',
                    task: 'tts',
                    function: 'SpeechSynthesizer',
                    model: 'cosyvoice-v2',
                    parameters: {
                        text_type: 'PlainText',
                        voice: voice_id, // 音色
                        format: 'mp3', // 音频格式  
                        sample_rate: 24000, // 采样率   
                        volume: 100, // 音量
                        rate: 1, // 语速
                        pitch: 1 // 音调
                    },
                    input: {}
                }
            }, null, 4);

            connectServerBeforeCb();
            // 创建WebSocket客户端
            const _ws = new WebSocket(url, {
                headers: {
                    Authorization: `bearer ${api_key}`,
                    'X-DashScope-DataInspection': 'enable'
                }
            });
            const ws = {
                close() {
                    // console.log("用户打断。");
                    shouldClose = true;
                    sendEnd();
                    !_ws.CLOSED && _ws.close();
                }
            };
            logWSServer(ws);


            _ws.on('open', () => {
                connectServerCb(true);
                _ws.send(runTaskMessage);
            });

            _ws.on('message', (data, isBinary) => {
                if (isBinary) {
                    !shouldClose && cb({ is_over: false, audio: data, ws });
                } else {
                    const message = JSON.parse(data);
                    switch (message.header.event) {
                        case 'task-started':
                            taskStarted = true;
                            // 发送continue-task指令
                            sendContinueTasks(_ws);
                            break;
                        case 'task-finished':
                            taskFinished = true;
                            const finishedTodo = () => {
                                cb({ is_over: true, audio: "", ws });
                                _ws.close();
                            }
                            // ESP-AI TTS 框架缺陷...
                            if (`${session_id}` === "0001") {
                                setTimeout(finishedTodo, 3000)
                            } else {
                                finishedTodo();
                            }
                            break;
                        case 'task-failed':
                            ttsServerErrorCb(`TTS 任务失败：${message.header.error_message}`)
                            log.error(runTaskMessage)
                            _ws.close();
                            break;
                        default:
                            // 可以在这里处理result-generated
                            break;
                    }
                }
            });

            function sendEnd() {
                if (taskFinished) return;
                // 发送finish-task指令
                const finishTaskMessage = JSON.stringify({
                    header: {
                        action: 'finish-task',
                        task_id: taskId,
                        streaming: 'duplex'
                    },
                    payload: {
                        task_group: 'audio', 
                        input: {}
                    }
                });
                _ws.OPEN && _ws.readyState === 1 && _ws.send(finishTaskMessage);
            }

            function sendContinueTasks() {
                const continueTaskMessage = JSON.stringify({
                    header: {
                        action: 'continue-task',
                        task_id: taskId,
                        streaming: 'duplex'
                    },
                    payload: {
                        task_group: 'audio',  
                        input: {
                            text
                        }
                    }
                });
                _ws.send(continueTaskMessage);
                // 发送finish-task指令
                sendEnd();
            }

            _ws.on('close', () => {
                connectServerCb(false);
            });

        } catch (err) {
            connectServerCb(false);
            log.error(`阿里云 TTS 错误： ${err}`)
        }

    }
}