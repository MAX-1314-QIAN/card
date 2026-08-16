(function(root){
  if(!root.PERSONA_BALANCE_MANIFEST||!root.PERSONA_BALANCE_RUNTIME_CONFIG){
    throw new Error('请先加载 balance/ 下的模块配置与 manifest.js');
  }
  root.BALANCE_V21=root.PERSONA_BALANCE_RUNTIME_CONFIG;
})(globalThis);
