import { title } from 'node:process';
import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {

  
     const storagedCart = localStorage.getItem('@RocketShoes:cart');

      if (storagedCart) {
        
        //transforma para o valor original que e um array de produtos
        return JSON.parse(storagedCart);
      }

      return [];
     
   
   
  });


const addProduct   = async (productId: number) => {
    
    try {
      //adiciona um produto novo no carrinho, mantendo todos produtos anteriores aplicando o conceito de imutabilidade 
      const updatedCart = [...cart];
     
      //vai buscar no carrinho se existe um produto com o id recebido
      const productExists = updatedCart.find(product => product.id === productId);
      
     //busca na api de stock os dados do id productId 
     const stock = await api.get(`/stock/${productId}`);
     
     //pega o amount do id passado recebido de stock
     const stockAmount = stock.data.amount;
     
     //se existe o produto no carrinho vou pega o amount dele senão é 0
     const currentAmount = productExists ? productExists.amount : 0;
    
     //se o produto já existe no carrinho, então soma a quantidade dele
     const amount = currentAmount + 1;
    

     //verifica o estoque
     if(amount > stockAmount) {
      toast.error('Quantidade solicitada fora de estoque');
      return;
     }

     //verifica se o produto existe, se ele existe muda a quantidade dele no carrinho
     if(productExists){
        productExists.amount = amount
     }else {
      //Se o produto não existe, ele busca na api os dados do meu produto do id productId
      //pega todos os dados de data do product, em seguida atribui o amount como 1 deixando 1 item no carrinho
        const product = await api.get(`/products/${productId}`);

        const newProduct = {
          ...product.data,
          amount: 1
        }
        //adiciona os dados no array
        updatedCart.push(newProduct);
     }
     //salva os dados no estado cart com o setCart
     setCart(updatedCart);

     //Salva os dados do produto no local Storage
     //JSON.stringify(updatedCart) => transaforma em string
     localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart))
     
    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      //adiciona um produto novo no carrinho, mantendo todos produtos anteriores aplicando o conceito de imutabilidade
      const updatedCart = [...cart];

      //retorna o indice do produto que seu id seja igual a productId
      const productIndex = updatedCart.findIndex(product => product.id === productId);
      
      //verifica se o indice obtido e maior ou igual a zero, se for então ele remove o produto
      // com o splice atraves do indice(productIndex) informado, na frente 1(quantidade).
      //depois atualiza os dados do estado cart com o setCart passando os novos produtos, menos
      // o produto removido, em seguida salva essa nova alteração no localstorage.
      if(productIndex >= 0){
        updatedCart.splice(productIndex, 1);
        setCart(updatedCart);
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart))
      }else{
        //pula direto pro catch
        throw Error();
      }
    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
     //verifica se a quantidade e menor ou igual a 0
      if(amount <= 0){
        return;
      }
      //busca na api stock os dados do produto do id productId
      const stock = await api.get(`/stock/${productId}`);
      //pega a quantidade do produto em estoque
      const stockAmount = stock.data.amount;
      
      //verifica se a quantidade e maior do que a que tem em estoque
      if(amount > stockAmount){
        toast.error('Quantidade solicitada fora de estoque');
        return;
      }

      //adiciona um produto novo no carrinho, mantendo todos produtos anteriores aplicando o conceito de imutabilidade
      const updatedCart = [...cart];
      
      //vai buscar no carrinho se existe um produto com o id recebido
      const productExists = updatedCart.find(product => product.id === productId);

      //verifica se o produto existe, se ele existe muda a quantidade dele no carrinho
      if(productExists){
        productExists.amount = amount;

        //salva os dados no estado cart pelo setCart, respeitando o conceito de imutabilidade, ou seja, 
        // ele cria um novo array com os dados antigos mais os dados novos que foi alterado.
        setCart(updatedCart);

        //salva os dados no localstorage
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart))
      }else{
        throw Error();
      }

    } catch {
      toast.error('Erro na alteração de quantidade do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
