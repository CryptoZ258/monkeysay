# monkeysay
a programmer SNS, like twitter, you can tweet and paste code, share photos

# Framework and Platform
this Website is base on LeanCloud Storage Service and File Service, using node.js and Express(using jade write template)to implement the server side. The demo is in [here](https://monkeysay.leanapp.cn)

# Functions
In Monkeysay, we can:
* tweet using Markdown
* post comments for post
* share codes and website
* store and share photos

The Website and Mobile client is getting better when we commit code later.

# Mobile
We develope the mobile iOS/Android Native App base on the ReactNative for MonkeySay, It will be commit later.

# Run and debug
first, you should have [Node.js](http://nodejs.org/) and [LeanCloud CLI](https://www.leancloud.cn/docs/leanengine_cli.html) installed,
then checkout this project from github:

```
$ git clone https://github.com/bibodeng/monkeysay.git
$ cd leanengine-todo-demo
```

install dependencies:

```
$ npm install
```

add appliaction:

```
lean app add origin <appId>
```

this appId is your LeanCloud Project appId.

run the project：

```
lean up
```

success！使用 [http://localhost:3000/](http://localhost:3000/) to visit it.

## deploy to LeanEngine

deploy to the LeanEngine to the test environment（or don't have a test environment, the product environment ）:
```
lean deploy
```

publish to the product environment:
```
lean publish
```

-----

# 猿说
一个程序员的社区网站，和Twitter类似，不仅可以发推文，还可以贴上的你的代码，上传你的图片分享给他人。

# 框架和平台
该项目是基于 [LeanCloud](https://leancloud.cn/) 的 [LeanEngine](https://leancloud.cn/docs/leanengine_overview.html) 开发，使用 Node.js 和 Express 实现。

在 [这里](https://monkeysay.leanapp.cn) 可以在线体验。

## 功能

* 使用Markdown语法发推文
* 在推文下互相用Markdown评论
* 分享代码和网站
* 存储和分享照片

## 移动端
移动端正在开发中，我们使用ReactNative实现一个iOS、Android版本的「猿说」原生App

## 本地开发调试

首先确认本机已经安装 [Node.js](http://nodejs.org/) 运行环境和 [LeanCloud 命令行工具](https://www.leancloud.cn/docs/leanengine_cli.html)，然后执行下列指令来检出项目：

```
$ git clone https://github.com/bibodeng/monkeysay.git
$ cd leanengine-todo-demo
```

安装依赖：

```
$ npm install
```

关联应用：

```
lean app add origin <appId>
```

这里的 appId 填上你在 LeanCloud 上创建的应用的 appId 即可。

启动项目：

```
lean up
```

恭喜你，启动成功！使用 [http://localhost:3000](http://localhost:3000) 体验项目。

## 部署到 LeanEngine

部署到预备环境（若无预备环境则直接部署到生产环境）：
```
lean deploy
```

将预备环境的代码发布到生产环境：
```
lean publish
```
