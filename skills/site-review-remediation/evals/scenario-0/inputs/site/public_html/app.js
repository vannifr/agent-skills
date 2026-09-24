function initNewsletter() {
  const form = document.getElementById('newsletterForm');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const res = await fetch('subscribe.php', { method: 'POST', body: JSON.stringify({ email: form.email.value }) });
    document.getElementById('msg').textContent = res.status === 409 ? 'Already subscribed.' : 'Thanks!';
  });
}
document.addEventListener('DOMContentLoaded', initNewsletter);
window.addEventListener('load', initNewsletter);
