# bind-knot
使用 AGI 连接你能想象的东西

# Development

1. 本项目使用 [dotenv](https://github.com/motdotla/dotenv#readme) 来设置变量，对一些隐私数据进行保护   
  具体的字段查看 [.env.d.ts](src/env.d.ts)  
  将 [参考配置](.env.sample) 重命名为 `.env` 或者参考 dotenv 的说明来使用
2. 在 `src/server/` 下可自建业务模块文件夹进行开发，需要保留一个 `$YourModule/index.ts` 的主出口文件，然后在 [router](src/server/router.ts) 文件中导入注册
3. 目前使用 **测试驱动** 的模式进行功能的调试验证，具体参考 [vitest](https://github.com/vitest-dev/vitest#readme) 的使用
   
