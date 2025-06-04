// ------------- 1) LocalStorage Fonksiyonları ---------------

// Bu fonksiyon, tarayıcının localStorage'ından "tasks" anahtarına karşılık gelen değeri alır.
// Eğer daha önce hiç görev kaydedilmediyse getirilen değer null olur.
// null değilse, JSON.parse ile metin hâlindeki JSON'u JavaScript dizisine çevirir.
// null ise boş bir dizi döndürür.
function loadTasksFromLocalStorage() {
  const data = localStorage.getItem("tasks");
  return data ? JSON.parse(data) : [];
}

// Bu fonksiyon, parametre olarak aldığı tasks dizisini JSON.stringify ile metne çevirir
// ve localStorage'ı "[\"id\":\"...\",...]" formatında günceller.
// Böylece görevlerimiz tarayıcı kapansa bile saklanır.
function saveTasksToLocalStorage(tasks) {
  localStorage.setItem("tasks", JSON.stringify(tasks));
}

// ------------- 2) Global Değişkenler -----------------------

// Uygulamanın şu anda hangi filtre modunda olduğunu tutar.
// Başlangıçta "all" (tümü) seçili olacak. Sonraki tıklamalarda "active" veya "completed" olabilir.
let currentFilter = "all"; // "all", "active", "completed"

// ------------- 3) Görev Listeleme -------------------------

// Bu fonksiyon, ekrandaki <ul id="task-list"> öğesinin içeriğini temizler,
// localStorage'dan görevleri alır, filtre uygular ve her bir görevi <li> olarak ekrana yazar.
// Parametre olarak filtre türünü alır. Örneğin "all", "active" veya "completed".
function renderTasks(filter = "all") {
  // 1) Görev listesini tutan <ul> öğesini seçiyoruz.
  const taskListEl = document.getElementById("task-list");
  // 2) Önbellekte kalmış eski <li> öğelerini kaldırmak için innerHTML'i sıfırlıyoruz.
  taskListEl.innerHTML = "";

  // 3) localStorage'dan tüm görevleri alıyoruz (dizi halinde).
  const tasks = loadTasksFromLocalStorage();

  // 4) Şu anki filtreye göre görevleri süzüyoruz.
  //    - "all" ise tüm görevleri döndür.
  //    - "active" ise tamamlanmamış görevleri döndür.
  //    - "completed" ise tamamlanmış görevleri döndür.
  const filteredTasks = tasks.filter((task) => {
    if (filter === "all") return true;
    if (filter === "active") return !task.completed;
    if (filter === "completed") return task.completed;
  });

  // 5) Filtrelenmiş her bir görev için <li> öğesi oluşturup ekrana ekliyoruz.
  filteredTasks.forEach((task) => {
    // a) Yeni bir <li> öğesi oluşturuyoruz.
    const li = document.createElement("li");

    // b) Tailwind sınıflarıyla birlikte, eğer görev tamamlanmışsa ek CSS sınıfları ekliyoruz:
    //    - opacity-60: %60 opaklık, yarı saydam görünüm
    //    - line-through: Üstü çizili metin stili
    //    - text-gray-500: Gri renkte metin rengi
    li.className =
      "flex items-center justify-between py-2 px-2 hover:bg-gray-50 " +
      (task.completed ? "opacity-60 line-through text-gray-500" : "");
    // c) Her <li> öğesine görev id'sini data-id özniteliği olarak ekliyoruz.
    //    Bu, tıklama veya silme sırasında hangi görevin seçildiğini bulmak için kullanılır.
    li.setAttribute("data-id", task.id);

    // --------------- Checkbox Oluşturma ---------------
    // Checkbox, görev tamamlandı/tamamlanmadı durumunu tutar.
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    // Eğer task.completed true ise checkbox işaretli, değilse boş olur.
    checkbox.checked = task.completed;
    // Tailwind: w-5 h-5 ile checkbox boyutunu 20px x 20px yapıyoruz.
    // text-blue-500 ile işaret simgesinin rengini mavi tonuna ayarlıyoruz.
    checkbox.className = "w-5 h-5 text-blue-500";
    // Checkbox durumu değiştiğinde ilgili görevin tamamlanma durumunu değiştirecek fonksiyonu çağırıyoruz.
    checkbox.addEventListener("change", () => {
      toggleTaskCompleted(task.id);
    });

    // --------------- Görev Metni (<span>) Oluşturma ---------------
    const span = document.createElement("span");
    // Tailwind: ml-3 ile soldan boşluk, flex-1 ile kalan alanı kapla, text-gray-800 ile koyu gri metin rengi
    span.className = "ml-3 flex-1 text-gray-800";
    // Kullanıcının yazdığı görev metnini ekrana yazıyoruz.
    span.textContent = task.text;

    // --------------- Silme Butonu Oluşturma ---------------
    const deleteBtn = document.createElement("button");
    // Tailwind: text-red-500 ile kırmızı simge, hover:text-red-700 ile fare üstünde koyu kırmızı,
    // ml-2 ile soldan boşluk, focus:outline-none ile odak konturunu kaldırıyoruz.
    deleteBtn.className =
      "text-red-500 hover:text-red-700 ml-2 focus:outline-none";
    // Butonun içine çöp kutusu emojisi ekliyoruz.
    deleteBtn.innerHTML = "🗑️";
    // Butona tıklandığında deleteTask fonksiyonunu çağırarak görevi siliyoruz.
    deleteBtn.addEventListener("click", () => {
      deleteTask(task.id);
    });

    // --------------- Düzenleme Butonu Oluşturma ---------------
    const editBtn = document.createElement("button");
    editBtn.className = "text-green-500 hover:text-green-700 ml-2 focus:outline-none";
    editBtn.innerHTML = "✏️";
    editBtn.addEventListener("click", () => {
      editTask(task.id);
    });

    // --------------- <li> İçine Elemanları Eklemek ---------------
    li.appendChild(checkbox);   // 1) Checkbox
    li.appendChild(span);       // 2) Görev metni
    li.appendChild(editBtn);    // 3) Düzenleme butonu
    li.appendChild(deleteBtn);  // 4) Silme butonu

    // --------------- Listeye <li> Eklemek ---------------
    taskListEl.appendChild(li);
  });

  // 6) Son olarak görev sayacını güncelliyoruz.
  updateTaskCounter();
}

// ------------- 4) Görev Ekleme ----------------------------

// Bu fonksiyon, parametre olarak aldığı metin ile yeni bir görev objesi oluşturur,
// mevcut görev dizisine ekler, localStorage'ı günceller ve listeyi yeniler.
function addTask(text) {
  // 1) Mevcut görevleri al
  const tasks = loadTasksFromLocalStorage();

  // 2) Yeni görev objesini oluştur
  //    - id: Benzersiz bir kimlik oluşturmak için Date.now() kullanıyoruz ve string'e çeviriyoruz.
  //    - text: Görev yazısını trim() ile baş/son boşlukları silerek kaydediyoruz.
  //    - completed: Yeni eklenen görev başlamada tamamlanmamış (false) olacak.
  const newTask = {
    id: Date.now().toString(),
    text: text.trim(),
    completed: false,
  };

  // 3) Yeni görevi dizinin sonuna ekle
  tasks.push(newTask);

  // 4) Güncellenen dizi localStorage'a kaydet
  saveTasksToLocalStorage(tasks);

  // 5) Mevcut filtreye göre listeyi tekrar çiz
  renderTasks(currentFilter);
}

// ------------- 5) Görev Durumunu Değiştirme ----------------

// Bu fonksiyon, tıklanan checkbox'ın görev id'sini alır,
// o görev objesinin completed değerini tersine çevirir, kaydeder ve listeyi yeniler.
function toggleTaskCompleted(taskId) {
  // 1) LocalStorage'dan mevcut görevleri al
  const tasks = loadTasksFromLocalStorage();

  // 2) .map ile her görevi dolaş, tıklanan görevin id'si eşleşiyorsa completed değerini !completed yap,
  //    diğerlerini olduğu gibi bırak.
  const updatedTasks = tasks.map((task) => {
    if (task.id === taskId) {
      return { ...task, completed: !task.completed };
    }
    return task;
  });

  // 3) Güncellenen diziyi localStorage'a kaydet
  saveTasksToLocalStorage(updatedTasks);

  // 4) Mevcut filtreye göre listeyi tekrar çiz
  renderTasks(currentFilter);
}

// ------------- 6) Görev Düzenleme -----------------------------

// Bu fonksiyon, verilen görev id'sine ait metni kullanıcıdan aldığı yeni metin
// ile günceller. Metin boş bırakılmazsa localStorage güncellenir ve liste
// mevcut filtreye göre yeniden çizilir.
function editTask(taskId) {
  // 1) LocalStorage'dan mevcut görevleri al
  const tasks = loadTasksFromLocalStorage();

  // 2) Düzenlenecek görevi bul
  const task = tasks.find((t) => t.id === taskId);
  if (!task) return;

  // 3) Kullanıcıdan yeni metni al. İptal edilirse null döner.
  const newText = prompt("Görev metnini düzenleyin:", task.text);
  if (newText === null) return;

  const trimmed = newText.trim();
  if (trimmed === "") return;

  // 4) Görevi güncelle
  const updatedTasks = tasks.map((t) =>
    t.id === taskId ? { ...t, text: trimmed } : t
  );

  // 5) Kaydet ve listeyi güncelle
  saveTasksToLocalStorage(updatedTasks);
  renderTasks(currentFilter);
}

// ------------- 7) Görev Silme -----------------------------

// Bu fonksiyon, tıklanan silme butonundan alınan görev id'sini alır,
// tasks dizisinden o id'ye sahip objeyi çıkartır, kalanları kaydeder ve listeyi yeniler.
function deleteTask(taskId) {
  // 1) LocalStorage'dan mevcut görevleri al
  const tasks = loadTasksFromLocalStorage();

  // 2) .filter ile görev dizisinden tıklanan görevin id'si hariç diğerlerini seç
  const filteredTasks = tasks.filter((task) => task.id !== taskId);

  // 3) Kalan görevleri localStorage'a kaydet
  saveTasksToLocalStorage(filteredTasks);

  // 4) Mevcut filtreye göre listeyi tekrar çiz
  renderTasks(currentFilter);
}

// ------------- 8) Görev Sayacını Güncelleme ---------------

// Bu fonksiyon, localStorage'dan görevleri alır,
// tamamlanmamış olanları sayar ve altta görünen "X görev kaldı" metnini günceller.
function updateTaskCounter() {
  // 1) LocalStorage'dan görev listesini al
  const tasks = loadTasksFromLocalStorage();

  // 2) Tamamlanmamış görevleri filtreleyip sayısını al
  const activeCount = tasks.filter((t) => !t.completed).length;

  // 3) sayaç <div> öğesini seç
  const counterEl = document.getElementById("task-counter");

  // 4) İçeriğini güncelle: Örneğin "3 görev kaldı"
  counterEl.textContent = `${activeCount} görev kaldı`;
}

// ------------- 9) Event Listener’ları ---------------------

// DOMContentLoaded: HTML tamamen yüklendiğinde bu blok içindeki kodlar çalışır.
// Böylece document.getElementById gibi seçimler hatasız çalışır.
document.addEventListener("DOMContentLoaded", () => {
  // 1) "Ekle" butonunu ve metin kutusunu seç
  const addBtn = document.getElementById("add-task-btn");
  const inputEl = document.getElementById("new-task-input");

  // 2) "Ekle" butonuna tıklama işlemi
  addBtn.addEventListener("click", () => {
    // a) Metin kutusundaki yazıyı al
    const text = inputEl.value;
    // b) Eğer metin sadece boşluk değilse görevi ekle
    if (text.trim() !== "") {
      addTask(text);
      // c) Görev eklendikten sonra metin kutusunu temizle
      inputEl.value = "";
    }
  });

  // 3) Enter tuşu ile de görev ekleme (kullanıcı Enter'a bastığında tıpkı "Ekle" butonuna basılmış gibi çalışır)
  inputEl.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      // Form gönderme veya sayfa yenileme gibi default davranışı iptal et
      e.preventDefault();
      // "Ekle" butonunu programatik olarak tıkla
      addBtn.click();
    }
  });

  // 4) Filtre butonlarını seç (".filter-btn" sınıfına sahip tüm butonlar)
  const filterButtons = document.querySelectorAll(".filter-btn");
  filterButtons.forEach((btn) => {
    // Her bir butona tıklama olayı ekliyoruz
    btn.addEventListener("click", () => {
      // a) Önce tüm butonların "aktif" stilini (mavi-beyaz) kaldır,
      //    yerine "pasif" stil (gri-koyu gri) ekle
      filterButtons.forEach((b) =>
        b.classList.remove("bg-blue-500", "text-white")
      );
      filterButtons.forEach((b) =>
        b.classList.add("bg-gray-200", "text-gray-700")
      );

      // b) Tıklanan butondan "pasif" sınıflarını kaldır,
      //    "aktif" sınıflarını ekle
      btn.classList.remove("bg-gray-200", "text-gray-700");
      btn.classList.add("bg-blue-500", "text-white");

      // c) Hangi filtre seçilmişse currentFilter'ı güncelle
      currentFilter = btn.getAttribute("data-filter");
      // d) Yeni filtre uygulanarak liste tekrar çizilsin
      renderTasks(currentFilter);
    });
  });

  // 5) Uygulama ilk açıldığında mevcut filtre (başlangıçta "all") ile listeyi çiz
  renderTasks(currentFilter);
});
