// Firebase config & Firestore (dùng cho web tĩnh trên GitHub Pages)
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, query, orderBy, where, deleteDoc, doc } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyBDbgzhNqFvechNAPtVBHVztNBiLOy3kzs",
    authDomain: "trietlong-465bf.firebaseapp.com",
    projectId: "trietlong-465bf",
    storageBucket: "trietlong-465bf.firebasestorage.app",
    messagingSenderId: "778525005458",
    appId: "1:778525005458:web:d31bb89578120536a7384b",
    measurementId: "G-W6R545GREQ"
};
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Tạo slug từ tiêu đề
function slugify(str) {
    return str.toLowerCase()
        .normalize('NFD').replace(/\p{Diacritic}/gu, '')
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-+|-+$/g, '');
}

// Lấy danh sách bài viết từ Firestore
async function getPosts() {
    const q = query(collection(db, "posts"), orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

// Lưu bài viết mới vào Firestore
async function handleAddPost(e) {
    e.preventDefault();
    const title = document.getElementById('title').value.trim();
    const content = document.getElementById('content').value.trim();
    const seoTitle = document.getElementById('seoTitle').value.trim();
    const seoDescription = document.getElementById('seoDescription').value.trim();
    const slugInput = document.getElementById('slug') ? document.getElementById('slug').value.trim() : '';
    if (!title || !content) return;
    let slug = slugInput ? slugify(slugInput) : slugify(title);
    // Đảm bảo slug là duy nhất
    const posts = await getPosts();
    let origSlug = slug,
        i = 1;
    while (posts.some(p => p.slug === slug)) {
        slug = origSlug + '-' + i++;
    }
    await addDoc(collection(db, "posts"), {
        title,
        content,
        slug,
        seoTitle,
        seoDescription,
        createdAt: new Date()
    });
    window.location.href = 'index.html';
}

// Render danh sách bài viết trên index.html
async function renderPostList() {
    const posts = await getPosts();
    const list = document.getElementById('post-list');
    if (!list) return;
    list.innerHTML = '';
    if (posts.length === 0) {
        list.innerHTML = '<li class="list-group-item">Chưa có bài viết nào.</li>';
        return;
    }
    posts.forEach(post => {
        const li = document.createElement('li');
        li.className = 'list-group-item d-flex justify-content-between align-items-center';
        const a = document.createElement('a');
        a.href = `detail.html?slug=${encodeURIComponent(post.slug)}`;
        a.textContent = post.title;
        // Nút xóa
        const btn = document.createElement('button');
        btn.className = 'btn btn-danger btn-sm';
        btn.textContent = 'Xóa';
        btn.onclick = async(e) => {
            e.preventDefault();
            if (confirm('Bạn có chắc muốn xóa bài viết này?')) {
                await deletePost(post.slug);
                renderPostList();
            }
        };
        li.appendChild(a);
        li.appendChild(btn);
        list.appendChild(li);
    });
}

// Xóa bài viết theo slug
async function deletePost(slug) {
    const q = query(collection(db, "posts"), where("slug", "==", slug));
    const querySnapshot = await getDocs(q);
    for (const d of querySnapshot.docs) {
        await deleteDoc(doc(db, "posts", d.id));
    }
}

// Render chi tiết bài viết trên detail.html
async function renderPostDetail() {
    const params = new URLSearchParams(window.location.search);
    const slug = params.get('slug');
    const posts = await getPosts();
    const post = posts.find(p => p.slug === slug);
    if (!post) {
        document.getElementById('post-title').textContent = 'Không tìm thấy bài viết.';
        return;
    }
    document.title = post.seoTitle || post.title;
    if (post.seoTitle || post.seoDescription) {
        const meta = document.getElementById('seo-meta');
        if (post.seoTitle) meta.innerHTML += `<meta name="title" content="${post.seoTitle}">`;
        if (post.seoDescription) meta.innerHTML += `<meta name="description" content="${post.seoDescription}">`;
    }
    document.getElementById('post-title').textContent = post.title;
    const contentDiv = document.getElementById('post-content');
    contentDiv.innerHTML = post.content;
    renderTOC(contentDiv);
}

// Tạo mục lục tự động dựa trên h2, h3
function renderTOC(contentDiv) {
    const tocDiv = document.getElementById('toc');
    if (!tocDiv) return;
    const headers = contentDiv.querySelectorAll('h2, h3');
    if (headers.length === 0) {
        tocDiv.innerHTML = '';
        return;
    }
    let tocHtml = '<strong>Mục lục</strong><ul>';
    headers.forEach((header, idx) => {
        if (!header.id) header.id = 'toc-' + idx;
        tocHtml += `<li class="ms-${header.tagName === 'H3' ? '4' : '2'}"><a href="#${header.id}">${header.textContent}</a></li>`;
    });
    tocHtml += '</ul>';
    tocDiv.innerHTML = tocHtml;
}