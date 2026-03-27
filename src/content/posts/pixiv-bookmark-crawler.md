---
title: "使用 Python 爬取 P 站收藏"
published: 2024-11-03
description: "抓取 Pixiv 收藏作品原图并批量下载，带有进度显示与并发。"
image: ""
tags: ["Pixiv", "Python", "爬虫", "代码示例"]
category: "代码示例"
draft: false
---

# 介绍

都是一些基础的东西啦，需要下载 `tqdm`、`requests` 等库，然后把 `user_id` 和 `cookie` 换成自己的，直接运行代码。参数自己看注释调整吧。  
cookie 可以用浏览器插件获取，或 F12 开发者工具查看。

本代码参考于 CSDN 的博文。  
添加什么额外功能自己看着改吧。  
仅供学习交流使用，请勿用于商业用途。

相对来说还是比较简单的一个东西，喜欢的话发个评论互动一下吧。

> 注意：部分接口在未登录或 Cookie/权限不正确时可能返回 404；请确保使用自己的账号、有效的 Cookie，并遵守站点条款。

---

# 代码

```python
import os
import re
import time
import requests
import concurrent.futures as futures
from typing import Set, Iterable, Callable, Dict, Optional, Tuple
from tqdm import tqdm


class Downloader:
    """处理图像下载的类"""
    def __init__(self, capacity, headers, threads, standard_time, date):
        self.url_group: Set[str] = set()
        self.capacity = capacity   # 最大下载量(MB)
        self.store_path = date + "/"   # 当前日期作为存储路径
        self.standard_time = standard_time
        self.threads = threads
        self.headers = headers.copy()

    def add(self, urls: Iterable[str]):
        """添加待下载的URL"""
        for url in urls:
            self.url_group.add(url)

    def download_image(self, url: str) -> float:
        """下载单个图像并返回其大小"""
        image_name = url[url.rfind("/") + 1:]
        image_id = re.search(r"/(\d+)_", url).group(1)
        image_path = self.store_path + image_name
        self.headers.update({"Referer": f"https://www.pixiv.net/artworks/{image_id}"})
        os.makedirs(self.store_path, exist_ok=True)
        
        if os.path.exists(image_path):
            return 0

        for _ in range(10):
            try:
                response = requests.get(url, headers=self.headers, timeout=(4, self.standard_time))
                if response.status_code == 200:
                    image_size = int(response.headers.get("content-length", 0))
                    with open(image_path, "wb") as f:
                        f.write(response.content)
                    return image_size / (1 << 20)
            except Exception:
                pass
        return 0

    def download(self):
        """启动下载过程并返回下载的总大小"""
        flow_size = .0
        print("===== downloader start =====")
        with futures.ThreadPoolExecutor(self.threads) as executor:
            with tqdm(total=len(self.url_group), desc="downloading") as pbar:
                for image_size in executor.map(self.download_image, self.url_group):
                    flow_size += image_size
                    pbar.update()
                    pbar.set_description(f"downloading / flow {flow_size:.2f}MB")
                    if flow_size > self.capacity:
                        executor.shutdown(wait=False, cancel_futures=True)
                        break
        print("===== downloader complete =====")
        return flow_size


class Collector:
    """收集作品URL的类"""
    def __init__(self, threads, user_id, headers, downloader):
        self.id_group: Set[str] = set()  
        self.threads = threads
        self.user_id = user_id
        self.headers = headers.copy()
        self.downloader = downloader

    def add(self, image_ids):
        """添加图像ID"""
        self.id_group.add(image_ids)

    def select_page(self, response) -> Set[str]:
        """从响应中选择作品的URL"""
        group = set()
        for url in response.json()["body"]:
            group.add(url["urls"]["original"])
        return group

    def get_artworks_urls(self, args: Tuple[str, Callable, Optional[Dict]]) -> Optional[Iterable[str]]:
        """获取作品的URL"""
        url, selector, additional_headers = args
        headers = self.headers
        headers.update(additional_headers)
        time.sleep(1)

        for _ in range(10):
            try:
                response = requests.get(url, headers=headers, timeout=4)
                if response.status_code == 200:
                    id_group = selector(response)
                    return id_group
            except Exception as e:
                print(e)
            time.sleep(1)

    def collect(self):
        """启动收集过程"""
        print("===== collector start =====")
        with futures.ThreadPoolExecutor(self.threads) as executor:
            with tqdm(total=len(self.id_group), desc="collecting urls") as pbar:
                urls_list = [f"https://www.pixiv.net/ajax/illust/{illust_id}/pages?lang=zh" for illust_id in self.id_group]
                additional_headers = [
                    {
                        "Referer": f"https://www.pixiv.net/artworks/{illust_id}",
                        "x-user-id": self.user_id,
                    }
                    for illust_id in self.id_group]
                
                for urls in executor.map(self.get_artworks_urls, zip(urls_list, [self.select_page] * len(urls_list), additional_headers)):
                    if urls is not None:
                        self.downloader.add(urls)
                    pbar.update()
        print("===== collector complete =====")
        return self.id_group


class BookmarkCrawler:
    """每个页面爬虫类"""
    def __init__(self, user_id, max_pages=5):
        self.user_id = user_id
        self.max_pages = max_pages
        self.headers = {
            "User-Agent": "Mozilla/5.0",
            "Cookie": "自己提取",
        }
        self.threads = 12
        self.capacity = 10000
        self.standard_time = 10
        self.date = time.strftime("%Y%m%d")
        self.downloader = Downloader(self.capacity, self.headers, self.threads, self.standard_time, self.date)
        self.collector = Collector(self.threads, self.user_id, self.headers, self.downloader)

    def get_bookmarks(self):
        """获取用户总页面"""
        for page in range(1, self.max_pages + 1):
            url = f"https://www.pixiv.net/ajax/user/{self.user_id}/illusts/bookmarks?tag=&offset={(page - 1) * 48}&limit=48&rest=show&lang=zh"
            response = requests.get(url, headers=self.headers)
            if response.status_code == 200:
                works = response.json()["body"]["works"]
                for work in works:
                        self.collector.add(str(work["id"]))
            else:
                print(f"Failed to fetch bookmarks from page {page}")
            time.sleep(1)

    def run(self):
        """运行爬虫，执行获取页面、收集和下载操作"""
        self.get_bookmarks()
        self.collector.collect()
        self.downloader.download()


if __name__ == "__main__":
    """参数设置"""
    BookmarkCrawler(user_id="96765879", max_pages=7).run()
```

---

# 注意事项

- 接口在非登录或 Cookie 无效时可能返回 404；需确保你的账号权限与 Cookie 正确。
- 合理设置下载并发与速率，避免请求过快导致被限制。
- 请遵守站点使用条款，仅用于学习交流。
