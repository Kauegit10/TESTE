import React, { useState, useEffect, useMemo } from 'react';
import { 
  ShoppingCart, 
  User as UserIcon, 
  Menu, 
  X, 
  Plus, 
  Trash2, 
  LogOut, 
  Moon, 
  Sun, 
  History, 
  Package,
  ChevronRight,
  MessageCircle,
  ShoppingBag
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { User, Product, CartItem } from './types';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [activeCategory, setActiveCategory] = useState<'All' | 'CPM' | 'Marketplace'>('All');
  
  // Admin state
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: '',
    price: '',
    description: '',
    image: '',
    category: 'CPM' as 'CPM' | 'Marketplace',
    whatsapp_number: ''
  });

  useEffect(() => {
    fetchProducts();
    const savedUser = localStorage.getItem('user');
    if (savedUser) setUser(JSON.parse(savedUser));
    const savedDarkMode = localStorage.getItem('darkMode') === 'true';
    setDarkMode(savedDarkMode);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    localStorage.setItem('darkMode', darkMode.toString());
  }, [darkMode]);

  const fetchProducts = async () => {
    const res = await fetch('/api/products');
    const data = await res.json();
    setProducts(data);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();
    if (data.success) {
      setUser(data.user);
      localStorage.setItem('user', JSON.stringify(data.user));
      setIsLoginOpen(false);
      setUsername('');
      setPassword('');
    } else {
      alert(data.error);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();
    if (data.success) {
      setIsRegister(false);
      alert('Registration successful! Please login.');
    } else {
      alert(data.error);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    setIsAdminPanelOpen(false);
  };

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...product, quantity: 1 }];
    });
    setIsCartOpen(true);
  };

  const removeFromCart = (id: number) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const updateQuantity = (id: number, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const checkout = () => {
    if (cart.length === 0) return;
    
    // Group items by WhatsApp number
    const grouped = cart.reduce((acc, item) => {
      if (!acc[item.whatsapp_number]) acc[item.whatsapp_number] = [];
      acc[item.whatsapp_number].push(item);
      return acc;
    }, {} as Record<string, CartItem[]>);

    // For simplicity, if multiple numbers exist, we'll process the first one or prompt.
    // The user request implies a direct redirect. We'll take the first number found.
    const firstNum = Object.keys(grouped)[0];
    const items = grouped[firstNum];
    
    const message = `Olá! Gostaria de comprar os seguintes itens:\n\n${items.map(i => `- ${i.name} (${i.quantity}x) - R$ ${(i.price * i.quantity).toFixed(2)}`).join('\n')}\n\nTotal: R$ ${items.reduce((sum, i) => sum + (i.price * i.quantity), 0).toFixed(2)}`;
    
    const url = `https://wa.me/${firstNum.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...newProduct, admin_password: 'admin123' })
    });
    if (res.ok) {
      fetchProducts();
      setNewProduct({ name: '', price: '', description: '', image: '', category: 'CPM', whatsapp_number: '' });
      alert('Product added!');
    }
  };

  const handleDeleteProduct = async (id: number) => {
    if (!confirm('Are you sure?')) return;
    const res = await fetch(`/api/products/${id}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ admin_password: 'admin123' })
    });
    if (res.ok) fetchProducts();
  };

  const filteredProducts = useMemo(() => {
    if (activeCategory === 'All') return products;
    return products.filter(p => p.category === activeCategory);
  }, [products, activeCategory]);

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  return (
    <div className={`min-h-screen transition-colors duration-300 ${darkMode ? 'bg-zinc-950 text-zinc-100' : 'bg-zinc-50 text-zinc-900'}`}>
      {/* Navbar */}
      <nav className={`fixed top-0 w-full z-40 border-b backdrop-blur-md ${darkMode ? 'bg-zinc-950/80 border-zinc-800' : 'bg-white/80 border-zinc-200'}`}>
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsMenuOpen(true)} className="p-2 hover:bg-zinc-500/10 rounded-full">
              <Menu size={24} />
            </button>
            <h1 className="text-xl font-bold tracking-tighter flex items-center gap-2">
              <ShoppingBag className="text-emerald-500" />
              NEXUS
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={() => setIsCartOpen(true)}
              className="p-2 hover:bg-zinc-500/10 rounded-full relative"
            >
              <ShoppingCart size={24} />
              {cart.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-emerald-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
                  {cart.reduce((s, i) => s + i.quantity, 0)}
                </span>
              )}
            </button>
            {user ? (
              <div className="flex items-center gap-2 ml-2">
                <span className="text-sm font-medium hidden sm:inline">{user.username}</span>
                <button onClick={logout} className="p-2 hover:bg-red-500/10 text-red-500 rounded-full">
                  <LogOut size={20} />
                </button>
              </div>
            ) : (
              <button 
                onClick={() => setIsLoginOpen(true)}
                className="ml-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition-colors"
              >
                Entrar
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="pt-24 pb-12 px-4 max-w-7xl mx-auto">
        {/* Categories */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2 no-scrollbar">
          {['All', 'CPM', 'Marketplace'].map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat as any)}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
                activeCategory === cat 
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/20' 
                : `${darkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'} border`
              }`}
            >
              {cat === 'All' ? 'Todos' : cat}
            </button>
          ))}
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map((product) => (
            <motion.div
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              key={product.id}
              className={`group rounded-2xl border overflow-hidden transition-all hover:shadow-xl ${
                darkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'
              }`}
            >
              <div className="aspect-square overflow-hidden relative">
                <img 
                  src={product.image || `https://picsum.photos/seed/${product.id}/400/400`} 
                  alt={product.name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute top-3 left-3">
                  <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                    product.category === 'CPM' ? 'bg-blue-500 text-white' : 'bg-purple-500 text-white'
                  }`}>
                    {product.category}
                  </span>
                </div>
              </div>
              <div className="p-5">
                <h3 className="font-bold text-lg mb-1 truncate">{product.name}</h3>
                <p className={`text-sm mb-4 line-clamp-2 ${darkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>
                  {product.description}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-xl font-black text-emerald-500">
                    R$ {product.price.toFixed(2)}
                  </span>
                  <button 
                    onClick={() => addToCart(product)}
                    className="p-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-emerald-500 hover:text-white rounded-xl transition-colors"
                  >
                    <Plus size={20} />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {filteredProducts.length === 0 && (
          <div className="text-center py-20">
            <Package size={48} className="mx-auto mb-4 opacity-20" />
            <p className="text-zinc-500">Nenhum produto encontrado nesta categoria.</p>
          </div>
        )}
      </main>

      {/* Side Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMenuOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            />
            <motion.div 
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              className={`fixed left-0 top-0 bottom-0 w-80 z-50 p-6 flex flex-col ${
                darkMode ? 'bg-zinc-950 border-r border-zinc-800' : 'bg-white border-r border-zinc-200'
              }`}
            >
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-xl font-bold">Menu</h2>
                <button onClick={() => setIsMenuOpen(false)} className="p-2 hover:bg-zinc-500/10 rounded-full">
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-2 flex-1">
                <button 
                  onClick={() => setDarkMode(!darkMode)}
                  className="w-full flex items-center justify-between p-4 rounded-xl hover:bg-zinc-500/10 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {darkMode ? <Sun size={20} /> : <Moon size={20} />}
                    <span className="font-medium">Mudar Tema</span>
                  </div>
                  <div className={`w-10 h-5 rounded-full relative transition-colors ${darkMode ? 'bg-emerald-500' : 'bg-zinc-300'}`}>
                    <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${darkMode ? 'left-6' : 'left-1'}`} />
                  </div>
                </button>

                <button className="w-full flex items-center gap-3 p-4 rounded-xl hover:bg-zinc-500/10 transition-colors">
                  <UserIcon size={20} />
                  <span className="font-medium">Perfil</span>
                </button>

                <button className="w-full flex items-center gap-3 p-4 rounded-xl hover:bg-zinc-500/10 transition-colors">
                  <History size={20} />
                  <span className="font-medium">Histórico</span>
                </button>

                {user?.role === 'admin' && (
                  <button 
                    onClick={() => {
                      setIsAdminPanelOpen(true);
                      setIsMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-3 p-4 rounded-xl bg-emerald-500/10 text-emerald-500 font-bold transition-colors"
                  >
                    <Package size={20} />
                    <span>Painel ADM</span>
                  </button>
                )}
              </div>

              <div className="pt-6 border-t border-zinc-800/10 dark:border-zinc-200/10">
                <p className="text-xs text-zinc-500 text-center">Nexus Marketplace v1.0</p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Cart Drawer */}
      <AnimatePresence>
        {isCartOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCartOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              className={`fixed right-0 top-0 bottom-0 w-full max-w-md z-50 p-6 flex flex-col ${
                darkMode ? 'bg-zinc-950 border-l border-zinc-800' : 'bg-white border-l border-zinc-200'
              }`}
            >
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-2">
                  <ShoppingCart size={24} />
                  <h2 className="text-xl font-bold">Carrinho</h2>
                </div>
                <button onClick={() => setIsCartOpen(false)} className="p-2 hover:bg-zinc-500/10 rounded-full">
                  <X size={24} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
                {cart.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-zinc-500">
                    <ShoppingCart size={48} className="mb-4 opacity-20" />
                    <p>Seu carrinho está vazio</p>
                  </div>
                ) : (
                  cart.map((item) => (
                    <div key={item.id} className={`flex gap-4 p-3 rounded-2xl border ${darkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-zinc-50 border-zinc-200'}`}>
                      <img src={item.image} alt={item.name} className="w-20 h-20 rounded-xl object-cover" referrerPolicy="no-referrer" />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold truncate">{item.name}</h4>
                        <p className="text-emerald-500 font-bold text-sm">R$ {item.price.toFixed(2)}</p>
                        <div className="flex items-center gap-3 mt-2">
                          <div className="flex items-center border rounded-lg overflow-hidden border-zinc-700/20">
                            <button onClick={() => updateQuantity(item.id, -1)} className="px-2 py-1 hover:bg-zinc-500/10">-</button>
                            <span className="px-3 py-1 text-sm font-bold">{item.quantity}</span>
                            <button onClick={() => updateQuantity(item.id, 1)} className="px-2 py-1 hover:bg-zinc-500/10">+</button>
                          </div>
                          <button onClick={() => removeFromCart(item.id)} className="text-red-500 p-1 hover:bg-red-500/10 rounded-lg">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {cart.length > 0 && (
                <div className="pt-6 mt-6 border-t border-zinc-800/10 dark:border-zinc-200/10">
                  <div className="flex justify-between mb-4">
                    <span className="font-medium opacity-60">Subtotal</span>
                    <span className="font-bold text-xl">R$ {cartTotal.toFixed(2)}</span>
                  </div>
                  <button 
                    onClick={checkout}
                    className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-500/20"
                  >
                    Finalizar no WhatsApp
                    <ChevronRight size={20} />
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Login Modal */}
      <AnimatePresence>
        {isLoginOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsLoginOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className={`relative w-full max-w-md p-8 rounded-3xl shadow-2xl ${
                darkMode ? 'bg-zinc-900 border border-zinc-800' : 'bg-white'
              }`}
            >
              <h2 className="text-2xl font-bold mb-6 text-center">
                {isRegister ? 'Criar Conta' : 'Bem-vindo de volta'}
              </h2>
              <form onSubmit={isRegister ? handleRegister : handleLogin} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1 opacity-60">Usuário</label>
                  <input 
                    type="text" 
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className={`w-full px-4 py-3 rounded-xl border outline-none focus:ring-2 focus:ring-emerald-500 transition-all ${
                      darkMode ? 'bg-zinc-800 border-zinc-700' : 'bg-zinc-50 border-zinc-200'
                    }`}
                    placeholder="Seu nome de usuário"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 opacity-60">Senha</label>
                  <input 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`w-full px-4 py-3 rounded-xl border outline-none focus:ring-2 focus:ring-emerald-500 transition-all ${
                      darkMode ? 'bg-zinc-800 border-zinc-700' : 'bg-zinc-50 border-zinc-200'
                    }`}
                    placeholder="Sua senha"
                    required
                  />
                </div>
                <button 
                  type="submit"
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-emerald-500/20"
                >
                  {isRegister ? 'Cadastrar' : 'Entrar'}
                </button>
              </form>
              <div className="mt-6 text-center">
                <button 
                  onClick={() => setIsRegister(!isRegister)}
                  className="text-sm font-medium text-emerald-500 hover:underline"
                >
                  {isRegister ? 'Já tem uma conta? Entre aqui' : 'Não tem conta? Cadastre-se'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Admin Panel Modal */}
      <AnimatePresence>
        {isAdminPanelOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAdminPanelOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
              className={`relative w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col rounded-3xl shadow-2xl ${
                darkMode ? 'bg-zinc-900 border border-zinc-800' : 'bg-white'
              }`}
            >
              <div className="p-6 border-b border-zinc-800/10 dark:border-zinc-200/10 flex items-center justify-between">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <Package className="text-emerald-500" />
                  Painel Administrativo
                </h2>
                <button onClick={() => setIsAdminPanelOpen(false)} className="p-2 hover:bg-zinc-500/10 rounded-full">
                  <X size={24} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
                {/* Add Product Form */}
                <section>
                  <h3 className="text-lg font-bold mb-4">Adicionar Novo Produto</h3>
                  <form onSubmit={handleAddProduct} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input 
                      placeholder="Nome do Produto"
                      value={newProduct.name}
                      onChange={e => setNewProduct({...newProduct, name: e.target.value})}
                      className={`px-4 py-2 rounded-xl border outline-none ${darkMode ? 'bg-zinc-800 border-zinc-700' : 'bg-zinc-50 border-zinc-200'}`}
                      required
                    />
                    <input 
                      type="number"
                      placeholder="Preço (R$)"
                      value={newProduct.price}
                      onChange={e => setNewProduct({...newProduct, price: e.target.value})}
                      className={`px-4 py-2 rounded-xl border outline-none ${darkMode ? 'bg-zinc-800 border-zinc-700' : 'bg-zinc-50 border-zinc-200'}`}
                      required
                    />
                    <select 
                      value={newProduct.category}
                      onChange={e => setNewProduct({...newProduct, category: e.target.value as any})}
                      className={`px-4 py-2 rounded-xl border outline-none ${darkMode ? 'bg-zinc-800 border-zinc-700' : 'bg-zinc-50 border-zinc-200'}`}
                    >
                      <option value="CPM">CPM</option>
                      <option value="Marketplace">Marketplace</option>
                    </select>
                    <input 
                      placeholder="WhatsApp (Ex: 5511999999999)"
                      value={newProduct.whatsapp_number}
                      onChange={e => setNewProduct({...newProduct, whatsapp_number: e.target.value})}
                      className={`px-4 py-2 rounded-xl border outline-none ${darkMode ? 'bg-zinc-800 border-zinc-700' : 'bg-zinc-50 border-zinc-200'}`}
                      required
                    />
                    <input 
                      placeholder="URL da Imagem (Aceita links do ImgBB)"
                      value={newProduct.image}
                      onChange={e => setNewProduct({...newProduct, image: e.target.value})}
                      className={`px-4 py-2 rounded-xl border outline-none md:col-span-2 ${darkMode ? 'bg-zinc-800 border-zinc-700' : 'bg-zinc-50 border-zinc-200'}`}
                    />
                    <textarea 
                      placeholder="Descrição"
                      value={newProduct.description}
                      onChange={e => setNewProduct({...newProduct, description: e.target.value})}
                      className={`px-4 py-2 rounded-xl border outline-none md:col-span-2 h-24 ${darkMode ? 'bg-zinc-800 border-zinc-700' : 'bg-zinc-50 border-zinc-200'}`}
                      required
                    />
                    <button 
                      type="submit"
                      className="md:col-span-2 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold"
                    >
                      Salvar Produto
                    </button>
                  </form>
                </section>

                {/* Product List */}
                <section>
                  <h3 className="text-lg font-bold mb-4">Gerenciar Produtos</h3>
                  <div className="space-y-2">
                    {products.map(p => (
                      <div key={p.id} className={`flex items-center justify-between p-4 rounded-2xl border ${darkMode ? 'bg-zinc-800 border-zinc-700' : 'bg-zinc-50 border-zinc-200'}`}>
                        <div className="flex items-center gap-4">
                          <img src={p.image} alt="" className="w-12 h-12 rounded-lg object-cover" referrerPolicy="no-referrer" />
                          <div>
                            <p className="font-bold">{p.name}</p>
                            <p className="text-xs opacity-60">{p.category} • R$ {p.price.toFixed(2)}</p>
                          </div>
                        </div>
                        <button 
                          onClick={() => handleDeleteProduct(p.id)}
                          className="p-2 text-red-500 hover:bg-red-500/10 rounded-xl"
                        >
                          <Trash2 size={20} />
                        </button>
                      </div>
                    ))}
                  </div>
                </section>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Floating WhatsApp Support Button */}
      <a 
        href="https://wa.me/5511999999999" 
        target="_blank" 
        rel="noreferrer"
        className="fixed bottom-6 right-6 z-30 p-4 bg-emerald-500 text-white rounded-full shadow-2xl shadow-emerald-500/40 hover:scale-110 transition-transform"
      >
        <MessageCircle size={28} />
      </a>

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.1); border-radius: 10px; }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); }
      `}</style>
    </div>
  );
}
