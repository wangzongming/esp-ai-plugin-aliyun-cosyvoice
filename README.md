# esp-ai-plugin-aliyun-cosyvoice [![npm](https://img.shields.io/npm/v/esp-ai-plugin-aliyun-cosyvoice.svg)](https://www.npmjs.com/package/esp-ai-plugin-aliyun-cosyvoice) [![npm](https://img.shields.io/npm/dm/esp-ai-plugin-aliyun-cosyvoice.svg?style=flat)](https://www.npmjs.com/package/esp-ai-plugin-aliyun-cosyvoice)

让 esp-ai 支持阿里云的 cosyvoice-v2 语音克隆服务

 

# 安装
在你的 `ESP-AI` 项目中执行下面命令
```bash
npm i esp-ai-plugin-aliyun-cosyvoice
```

# 使用 
```js
const espAi = require("esp-ai"); 

espAi({ 
    // 配置使用插件并且为插件配置api-key
    tts_server: "esp-ai-plugin-aliyun-cosyvoice",
    tts_config: {
        // 获取地址： https://bailian.console.aliyun.com/#/api-key
        api_key:"xxx",
        // 获取地址： https://bailian.console.aliyun.com/   用cosyvoice克隆接口克隆的音色去克隆拿到的id，然后填入。
        voice_id:"xxx"
    }, 

    // 引入插件
    plugins: [ 
        require("esp-ai-plugin-aliyun-cosyvoice")
    ], 
});
```

