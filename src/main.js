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
    const { discount, sale_price, quantity } = purchase;
    const discountCoefficient = 1 - discount / 100;
    const revenue = discountCoefficient * sale_price * quantity;
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
       let bonus = 0;
       if (index === 0) {
         bonus = profit * 0.15;
         return bonus;
       } else if (index === 1 || index === 2) {
         bonus = profit * 0.1;
         return bonus;
       } else if (index === total - 1) {
         return bonus;
       } else {
         // Для всех остальных
         bonus = profit * 0.05;
         return bonus;
       }
     }
/**
 * Функция для анализа данных продаж
 * @param data
 * @param options
 * @returns {{revenue, top_products, bonus, name, sales_count, profit, seller_id}[]}
 */
function analyzeSalesData(data, options) {
    // @TODO: Проверка входных данных

    if (!data ||
        !Array.isArray(data.sellers) ||
        !Array.isArray(data.products) ||
        !Array.isArray(data.purchase_records) ||
        data.sellers.length === 0 ||
        data.products.length === 0 ||
        data.purchase_records.length === 0) {
        throw new Error('Некорректные входные данные');
    }
    // @TODO: Проверка наличия опций

    const { calculateRevenue, calculateBonus } = options; // Сюда передадим функции для расчётов
    if (!calculateRevenue || !calculateBonus) {
      throw new Error("Отсутствуют необходимые опции");
    }
    // @TODO: Подготовка промежуточных данных для сбора статистики
    const sellerStats = data.sellers.map((seller) => ({
        id: seller.id,
        name: `${seller.first_name} ${seller.last_name}`,
        revenue: 0,
        profit: 0,
        sales_count: 0,
        products_sold: {},
        bonus: 0,
        top_products: [],
      }));
    
    // @TODO: Индексация продавцов и товаров для быстрого доступа
 // Создаем индексы

 const sellerIndex = Object.fromEntries(sellerStats.map((item) => [item.id, item]));
 const productIndex = Object.fromEntries(data.products.map((item) => [item.sku, item]));

    // @TODO: Расчет выручки и прибыли для каждого продавца
    data.purchase_records.forEach((record) => {
        // Чек
        const seller = sellerIndex[record.seller_id]; // Продавец
    
        // Расчёт прибыли для каждого товара
        record.items.forEach((item) => {
          const product = productIndex[item.sku]; // Товар
          // Посчитать себестоимость (cost) товара как product.purchase_price, умноженную на количество товаров из чека
          const cost = product.purchase_price * item.quantity;
    
          // Посчитать выручку (revenue) с учётом скидки через функцию calculateRevenue
          const revenue = calculateRevenue(item);
    
          // Посчитать прибыль: выручка минус себестоимость
          const profit = revenue - cost;
    
          // Увеличить общую накопленную прибыль (profit) у продавца
          seller.profit += profit;
    
          // Учёт количества проданных товаров
          if (!seller.products_sold[item.sku]) {
            seller.products_sold[item.sku] = 0;
          }
          // По артикулу товара увеличить его проданное количество у продавца
          seller.products_sold[item.sku] += item.quantity;
        });
        // Увеличить количество продаж и выручку у продавца
        seller.sales_count++;
        seller.revenue += record.total_amount;
      });
    

    // @TODO: Сортировка продавцов по прибыли
    sellerStats.sort((a, b) => b.profit - a.profit);
    // @TODO: Назначение премий на основе ранжирования
    for (let i = 0; i <= sellerStats.length - 1; i++) {
        sellerStats[i].bonus = calculateBonus(sellerStats.indexOf(sellerStats[i]), sellerStats.length, sellerStats[i]);
      }
    
        // @TODO: Сформировать топ-10 продуктов

  for (let seller of sellerStats) {
    const entries = Object.entries(seller.products_sold);
    const productsSold = entries.map(([sku, quantity]) => ({ sku, quantity }));
    const productsSoldSorted = productsSold.sort((a, b) => b.quantity - a.quantity);
    const topProducts = productsSoldSorted.slice(0, 10);
    seller.top_products = topProducts;
  }

    // @TODO: Подготовка итоговой коллекции с нужными полями
 
    return sellerStats.map((seller) => ({
        seller_id: seller.id,
        name: seller.name,
        revenue: +seller.revenue.toFixed(2), // Число с двумя знаками после точки, выручка продавца
        profit: +seller.profit.toFixed(2), // Число с двумя знаками после точки, прибыль продавца
        sales_count: seller.sales_count, // Целое число, количество продаж продавца
        top_products: seller.top_products, // Массив объектов вида: { "sku": "SKU_008","quantity": 10}, топ-10 товаров продавца
        bonus: +seller.bonus.toFixed(2), // Число с двумя знаками после точки, бонус продавца
      }));
    }

    