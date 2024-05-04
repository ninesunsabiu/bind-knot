/* @refresh reload */
import { render } from 'solid-js/web';
import * as R from 'ramda';

import App from '@/App';

const renderOnce = R.once(($el: Element) => {
  const $div = document.createElement("div");
  $div.style.cssText = "margin-right: 4px"
  $el.prepend($div);
  render(() => <App />, $div);
})

// 使用MutationObserver监听DOM变化
const observer = new MutationObserver(mutations => {
  mutations.forEach(mutation => {
    if (mutation.type === "childList") {
      // 界面变更 查询插入位置是否存在 一旦发现存在 则开始执行渲染逻辑
      const mountTarget = document.querySelector(".top-bread-wrapper .right-area")
      if (mountTarget) {
        observer.disconnect()
        renderOnce(mountTarget)
      }
    }
  });
});

// 配置observer，指定要监听的目标节点和选项
observer.observe(document.body, {
  childList: true,
  subtree: true
});
