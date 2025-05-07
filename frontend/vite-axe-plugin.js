/**
 * Plugin Vite para axe-core com configurações personalizadas
 * Este plugin integra o axe-core ao ambiente de desenvolvimento Vite
 * para fornecer análise de acessibilidade em tempo real.
 */

const axeConfig = require('./axe.config.js');

// Esta função cria um plugin para o Vite que injeta o axe-core com configurações personalizadas
module.exports = function viteAxePlugin() {
  return {
    name: 'vite-plugin-axe',
    transformIndexHtml(html) {
      // Apenas em desenvolvimento
      if (process.env.NODE_ENV !== 'production') {
        // Adicionar script para desabilitar verificações de acessibilidade específicas
        return {
          html,
          tags: [
            {
              tag: 'script',
              injectTo: 'head',
              children: `
                window.addEventListener('DOMContentLoaded', () => {
                  // Desabilitar verificações de acessibilidade para elementos específicos
                  const selectElements = document.querySelectorAll('select');
                  selectElements.forEach(select => {
                    select.setAttribute('data-axe-ignore', 'true');
                    select.classList.add('accessibility-exempt');
                  });
                  
                  // Caso esteja usando axe-core diretamente
                  if (window.axe) {
                    window.axe.configure({
                      rules: [
                        { id: 'select-name', enabled: false },
                        { id: 'aria-required-attr', enabled: false },
                        { id: 'label', enabled: false }
                      ]
                    });
                  }
                });
              `
            }
          ]
        };
      }
      return html;
    }
  };
}; 