(function(root){
  'use strict';
  // 这里只保存公开接口地址，绝不能放 DeepSeek API Key。
  root.AI_PERSONA_API_CONFIG=Object.freeze({
    endpoint:'https://persona-card-ai-selector.dibajipa55.workers.dev/api/ai-persona/select',
    timeoutMs:6500
  });
})(globalThis);
