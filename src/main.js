/**
 * Функция для расчета выручки
 * @param purchase запись о покупке
 * @param _product карточка товара
 * @returns {number}
 */
   // @TODO: Расчет выручки от операции
      // purchase — это одна из записей в поле items из чека в data.purchase_records
   // _product — это продукт из коллекции data.products
function calculateSimpleRevenue(purchase, _product) {
    const discountFactor = 1 - (purchase.discount / 100);
    const revenue = purchase.sale_price * purchase.quantity * discountFactor;
    return revenue; 
}

/**
 * Функция для расчета бонусов
 * @param index порядковый номер в отсортированном массиве
 * @param total общее число продавцов
 * @param seller карточка продавца
 * @returns {number}
 */
function calculateBonusByProfit(index, total, seller) {
       // @TODO: Расчет бонуса от позиции в рейтинге
    const { profit } = seller;
    let bonusPercentage;
    
    if (index === 0) {
        bonusPercentage = 0.15; 
    } else if (index <= 2 && index > 0) {
        bonusPercentage = 0.10; 
    } else if (index < total - 1) {
        bonusPercentage = 0.05; 
    } else {
        bonusPercentage = 0; 
    }
      return profit * bonusPercentage;
}

/**
 * Функция для анализа данных продаж
 * @param data
 * @param options
 * @returns {{revenue, top_products, bonus, name, sales_count, profit, seller_id}[]}
 */
function analyzeSalesData(data, options) {
    // @TODO: Проверка входных данных

 if (!data
    || !Array.isArray(data.sellers) || data.sellers.length === 0
    || !Array.isArray(data.products) || data.products.length === 0
    || !Array.isArray(data.purchase_records) || data.purchase_records.length === 0
) {
    throw new Error('Некорректные входные данные: данные должны содержать непустые массивы sellers, products и purchase_records');
}
    
    // @TODO: Проверка наличия опций

    if (!options
        || typeof options.calculateRevenue !== 'function'
        || typeof options.calculateBonus !== 'function'
    ) {
        throw new Error('Некорректные опции: должны быть переданы функции calculateRevenue и calculateBonus');
    }
    // @TODO: Подготовка промежуточных данных для сбора статистики
    const sellerStats = data.sellers.map(seller => ({
        id: seller.id,
        name: `${seller.first_name} ${seller.last_name}`,
        revenue: 0,
        profit: 0,
        sales_count: 0,
        products_sold: {},
        bonus: 0
    }));
    // @TODO: Индексация продавцов и товаров для быстрого доступа
 // Создаем индексы
 const sellerIndex = {};
 const productIndex = {};
 
 try {
     // Индекс продавцов
     data.sellers.forEach(seller => {
        if (!seller.id || !seller.first_name || !seller.last_name) {
            throw new Error('Не все обязательные поля продавца заполнены');
        }
        sellerIndex[seller.id] = seller;
    });

    // Индекс товаров 
    data.products.forEach(product => {
        if (!product.sku) {
            throw new Error('Не все обязательные поля товара заполнены');
        }
        productIndex[product.sku] = product;
    });
} catch (e) {
    throw new Error(`Некорректная структура данных: ${e.message}`);
}
 }

    // @TODO: Расчет выручки и прибыли для каждого продавца
    data.purchase_records.forEach(record => {
        if (!record.seller_id || !record.items) {
            console.warn('Пропущена запись о продаже с неполными данными', record);
            return;
        }

        const seller = sellerIndex[record.seller_id];
        if (!seller) {
            console.warn(`Продавец с ID ${record.seller_id} не найден`);
            return;
        }

        const sellerStat = sellerStats.find(s => s.id === seller.id);
        if (!sellerStat) return;

        sellerStat.revenue += record.total_amount;
        sellerStat.sales_count += 1;

        record.items.forEach(item => {
            if (!item.sku || !item.quantity || !item.sale_price) {
                console.warn('Пропущен товар с неполными данными', item);
                return;
            }

            const product = productIndex[item.sku];
            if (!product) {
                console.warn(`Товар с артикулом ${item.sku} не найден`);
                return;
            }
         // Расчет показателей
         const revenue = options.calculateRevenue({
            sale_price: item.sale_price,
            quantity: item.quantity,
            discount: item.discount || 0
        }, product);
        
        const cost = product.purchase_price * item.quantity;
        const profit = revenue - cost; 

        // Обновление статистики 
        sellerStat.profit += profit;
    
        // Обновление счетчика товаров
            if (!sellerStat.products_sold[item.sku]) {
                sellerStat.products_sold[item.sku] = 0;
            }
            sellerStat.products_sold[item.sku] += item.quantity;
        });
    });

    // @TODO: Сортировка продавцов по прибыли
    sellerStats.sort((a, b) => b.profit - a.profit);
    // @TODO: Назначение премий на основе ранжирования
    sellerStats.forEach((seller, index) => { 
        seller.bonus = options.calculateBonus(index, sellerStats.length, seller);
        seller.top_products = Object.entries(seller.products_sold)
        .map(([sku, quantity]) => ({ sku, quantity }))
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 10);
});
    // @TODO: Подготовка итоговой коллекции с нужными полями
    return sellerStats.map(seller => ({
        seller_id: seller.id,
        name: seller.name,
        revenue: +seller.revenue.toFixed(2),
        profit: +seller.profit.toFixed(2),
        sales_count: seller.sales_count,
        top_products: seller.top_products,
        bonus: +seller.bonus.toFixed(2) 
    }));
}

    